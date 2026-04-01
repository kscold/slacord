interface UpdateHarnessOptions {
    packaged?: boolean;
    dialogResponse?: number;
    checkReject?: Error | null;
    downloadReject?: Error | null;
    allowMacAutoUpdate?: boolean;
}

const ORIGINAL_PLATFORM = process.platform;
const ORIGINAL_MAC_UPDATE = process.env.SLACORD_MAC_AUTO_UPDATE;

async function createHarness(options: UpdateHarnessOptions = {}) {
    vi.resetModules();
    vi.useFakeTimers();
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    process.env.SLACORD_MAC_AUTO_UPDATE = options.allowMacAutoUpdate ? 'true' : '';
    vi.spyOn(global, 'setImmediate').mockImplementation(((callback: (...args: any[]) => void, ...args: any[]) => {
        callback(...args);
        return 0 as any;
    }) as typeof setImmediate);

    const ipcHandlers = new Map<string, (...args: any[]) => Promise<any>>();
    const updateEvents = new Map<string, (payload?: any) => any>();
    const mainWindow = {
        isDestroyed: vi.fn(() => false),
        once: vi.fn(),
        hide: vi.fn(),
        setProgressBar: vi.fn(),
        webContents: {
            send: vi.fn(),
        },
    };

    const electronModule = {
        app: {
            isPackaged: options.packaged ?? true,
        },
        BrowserWindow: {
            getAllWindows: vi.fn(() => [mainWindow]),
        },
        dialog: {
            showMessageBox: vi.fn().mockResolvedValue({ response: options.dialogResponse ?? 1 }),
        },
        ipcMain: {
            handle: vi.fn((channel: string, handler: (...args: any[]) => Promise<any>) => {
                ipcHandlers.set(channel, handler);
            }),
        },
    };

    const autoUpdater = {
        logger: null,
        autoDownload: true,
        autoInstallOnAppQuit: false,
        autoRunAppAfterInstall: false,
        forceCodeSigning: false,
        on: vi.fn((event: string, handler: (payload?: any) => any) => {
            updateEvents.set(event, handler);
            return autoUpdater;
        }),
        checkForUpdates: vi.fn(() => options.checkReject ? Promise.reject(options.checkReject) : Promise.resolve({})),
        downloadUpdate: vi.fn(() => options.downloadReject ? Promise.reject(options.downloadReject) : Promise.resolve([])),
        quitAndInstall: vi.fn(),
    };

    vi.doMock('electron', () => electronModule);
    vi.doMock('electron-updater', () => ({ autoUpdater }));
    vi.doMock('electron-log', () => ({ default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

    const updates = await import('./updates');
    const updateStatus = await import('./update-status');

    updates.setupAutoUpdates(mainWindow as any);

    return {
        autoUpdater,
        ipcHandlers,
        mainWindow,
        updateEvents,
        updateStatus,
    };
}

describe('desktop updates integration', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM });
        if (ORIGINAL_MAC_UPDATE === undefined) delete process.env.SLACORD_MAC_AUTO_UPDATE;
        else process.env.SLACORD_MAC_AUTO_UPDATE = ORIGINAL_MAC_UPDATE;
    });

    it('패키징된 앱에서 업데이트 IPC와 autoUpdater 기본값을 구성함', async () => {
        const harness = await createHarness({ allowMacAutoUpdate: true });

        expect(harness.ipcHandlers.has('desktop:get-update-status')).toBe(true);
        expect(harness.ipcHandlers.has('desktop:check-for-updates')).toBe(true);
        expect(harness.ipcHandlers.has('desktop:download-update')).toBe(true);
        expect(harness.ipcHandlers.has('desktop:restart-to-update')).toBe(true);
        expect(harness.autoUpdater.autoDownload).toBe(false);
        expect(harness.autoUpdater.autoInstallOnAppQuit).toBe(true);
        expect(harness.autoUpdater.autoRunAppAfterInstall).toBe(true);
        expect(harness.autoUpdater.forceCodeSigning).toBe(true);
    });

    it('패키징된 앱에서 다운로드 후 재시작 설치 흐름을 진행함', async () => {
        const harness = await createHarness({ allowMacAutoUpdate: true });
        harness.updateEvents.get('update-available')?.({ version: '1.1.0' });

        const downloadPromise = harness.ipcHandlers.get('desktop:download-update')?.();
        expect(harness.autoUpdater.downloadUpdate).toHaveBeenCalledTimes(1);
        expect(harness.updateStatus.getUpdateStatus().stage).toBe('downloading');

        harness.updateEvents.get('download-progress')?.({ percent: 54 });
        expect(harness.updateStatus.getUpdateStatus().progress).toBeCloseTo(0.54, 2);

        await harness.updateEvents.get('update-downloaded')?.({ version: '1.1.0' });
        await downloadPromise;
        expect(harness.updateStatus.getUpdateStatus().stage).toBe('downloaded');

        const installPromise = harness.ipcHandlers.get('desktop:restart-to-update')?.();
        await installPromise;

        expect(harness.updateStatus.getUpdateStatus().stage).toBe('installing');
        expect(harness.mainWindow.hide).toHaveBeenCalled();
        expect(harness.autoUpdater.quitAndInstall).toHaveBeenCalledWith(false, true);
    });

    it('서명 검증 오류는 수동 다운로드 fallback 상태로 전환함', async () => {
        const harness = await createHarness({
            allowMacAutoUpdate: true,
            downloadReject: new Error('Code signature at URL did not pass validation'),
        });
        harness.updateEvents.get('update-available')?.({ version: '1.1.1' });

        const result = await harness.ipcHandlers.get('desktop:download-update')?.();
        const status = harness.updateStatus.getUpdateStatus();

        expect(result?.ok).toBe(false);
        expect(status.stage).toBe('error');
        expect(status.manualDownloadRequired).toBe(true);
        expect(status.detail).toContain('다운로드 페이지에서 새 버전을 다시 설치');
    });

    it('mac 자동 업데이트를 보류할 때는 앱 안 다운로드를 막고 수동 설치를 안내함', async () => {
        const harness = await createHarness();

        const result = await harness.ipcHandlers.get('desktop:download-update')?.();
        const status = harness.updateStatus.getUpdateStatus();

        expect(result?.ok).toBe(false);
        expect(status.stage).toBe('idle');
        expect(harness.autoUpdater.checkForUpdates).not.toHaveBeenCalled();
        expect(harness.autoUpdater.downloadUpdate).not.toHaveBeenCalled();

        const checkResult = await harness.ipcHandlers.get('desktop:check-for-updates')?.();
        expect(checkResult?.ok).toBe(false);
        expect(checkResult?.status.manualDownloadRequired).toBe(true);
        expect(checkResult?.status.detail).toContain('다운로드 페이지');
    });
});
