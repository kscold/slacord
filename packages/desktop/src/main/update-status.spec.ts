import { attachUpdateWindow, getUpdateStatus, setUpdateProgress, setUpdateStatus } from './update-status';

function makeWindow() {
    const closeHandlers: Array<() => void> = [];

    return {
        isDestroyed: vi.fn(() => false),
        once: vi.fn((event: string, handler: () => void) => {
            if (event === 'closed') closeHandlers.push(handler);
        }),
        setProgressBar: vi.fn(),
        webContents: {
            send: vi.fn(),
        },
        __close() {
            closeHandlers.forEach((handler) => handler());
        },
    };
}

describe('update-status', () => {
    beforeEach(() => {
        setUpdateStatus({
            stage: 'idle',
            detail: '',
            progress: null,
            availableVersion: null,
            manualDownloadRequired: false,
        });
    });

    it('윈도우를 붙이면 현재 상태를 즉시 전달함', () => {
        const window = makeWindow();

        attachUpdateWindow(window as any);

        expect(window.webContents.send).toHaveBeenCalledWith('desktop:update-status', getUpdateStatus());
    });

    it('상태가 바뀌면 모든 윈도우에 새 상태를 전파함', () => {
        const window = makeWindow();
        attachUpdateWindow(window as any);
        window.webContents.send.mockClear();

        setUpdateStatus({
            stage: 'available',
            detail: 'v1.1.0',
            progress: null,
            availableVersion: '1.1.0',
            manualDownloadRequired: false,
        });

        expect(window.webContents.send).toHaveBeenCalledWith('desktop:update-status', {
            stage: 'available',
            detail: 'v1.1.0',
            progress: null,
            availableVersion: '1.1.0',
            manualDownloadRequired: false,
        });
    });

    it('진행률이 바뀌면 프로그레스바를 갱신함', () => {
        const window = makeWindow();
        attachUpdateWindow(window as any);

        setUpdateProgress(0.42);
        setUpdateProgress(null);

        expect(window.setProgressBar).toHaveBeenNthCalledWith(1, 0.42);
        expect(window.setProgressBar).toHaveBeenNthCalledWith(2, -1);
    });

    it('닫힌 윈도우는 이후 상태 전파에서 제외함', () => {
        const window = makeWindow();
        attachUpdateWindow(window as any);
        window.webContents.send.mockClear();
        window.__close();

        setUpdateStatus({
            stage: 'error',
            detail: '실패',
            progress: null,
            availableVersion: null,
            manualDownloadRequired: true,
        });

        expect(window.webContents.send).not.toHaveBeenCalled();
    });
});
