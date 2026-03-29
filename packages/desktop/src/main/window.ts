import { app, BrowserWindow } from 'electron';
import { getPreloadPath, getStartUrl } from './config';
import { protectNavigation } from './permissions';

let isQuitting = false;
app.on('before-quit', () => { isQuitting = true; });

export function createMainWindow() {
    const window = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 1180,
        minHeight: 760,
        backgroundColor: '#0f0c09',
        titleBarStyle: 'hiddenInset',
        show: false,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            spellcheck: true,
            backgroundThrottling: false,
        },
    });

    protectNavigation(window.webContents);
    window.once('ready-to-show', () => window.show());

    // macOS: 빨간 X 클릭 시 창 숨기기 (렌더러+소켓 유지 → 알림 수신 가능)
    // Cmd+Q(before-quit) 시에만 실제 종료
    window.on('close', (event) => {
        if (process.platform === 'darwin' && !isQuitting) {
            event.preventDefault();
            window.hide();
        }
    });

    void window.loadURL(getStartUrl());
    return window;
}
