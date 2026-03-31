vi.mock('electron', () => ({
    contextBridge: {
        exposeInMainWorld: vi.fn(),
    },
    ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    },
}));

import { createDesktopBridge } from './index';

function createRenderer() {
    return {
        invoke: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    };
}

describe('desktop preload bridge', () => {
    it('각 IPC 메서드를 지정된 채널로 전달함', async () => {
        const renderer = createRenderer();
        renderer.invoke.mockResolvedValueOnce(true);
        renderer.invoke.mockResolvedValueOnce({ microphone: true, camera: false });
        renderer.invoke.mockResolvedValueOnce({ stage: 'idle', detail: '', progress: null, availableVersion: null, manualDownloadRequired: false });
        renderer.invoke.mockResolvedValueOnce({ ok: true });
        renderer.invoke.mockResolvedValueOnce({ ok: true });
        renderer.invoke.mockResolvedValueOnce({ ok: true });
        const bridge = createDesktopBridge(renderer as any);

        await bridge.notify('제목', '본문', '/dashboard');
        await bridge.requestMediaAccess();
        await bridge.getUpdateStatus();
        await bridge.checkForUpdates();
        await bridge.downloadUpdate();
        await bridge.restartToUpdate();

        expect(renderer.invoke).toHaveBeenNthCalledWith(1, 'desktop:notify', { title: '제목', body: '본문', href: '/dashboard' });
        expect(renderer.invoke).toHaveBeenNthCalledWith(2, 'desktop:request-media-access');
        expect(renderer.invoke).toHaveBeenNthCalledWith(3, 'desktop:get-update-status');
        expect(renderer.invoke).toHaveBeenNthCalledWith(4, 'desktop:check-for-updates');
        expect(renderer.invoke).toHaveBeenNthCalledWith(5, 'desktop:download-update');
        expect(renderer.invoke).toHaveBeenNthCalledWith(6, 'desktop:restart-to-update');
    });

    it('업데이트 리스너를 등록하고 해제 함수를 반환함', () => {
        const renderer = createRenderer();
        const bridge = createDesktopBridge(renderer as any);
        const listener = vi.fn();

        const dispose = bridge.onUpdateStatus(listener);
        const handler = renderer.on.mock.calls[0]?.[1];
        handler?.({}, { stage: 'available', detail: 'v1.1.0', progress: null, availableVersion: '1.1.0', manualDownloadRequired: false });
        dispose();

        expect(renderer.on).toHaveBeenCalledWith('desktop:update-status', expect.any(Function));
        expect(listener).toHaveBeenCalledWith({
            stage: 'available',
            detail: 'v1.1.0',
            progress: null,
            availableVersion: '1.1.0',
            manualDownloadRequired: false,
        });
        expect(renderer.off).toHaveBeenCalledWith('desktop:update-status', handler);
    });
});
