import { app, ipcMain } from 'electron';
import log from 'electron-log';
import { createMainWindow } from './window';
import { configurePermissions, requestMediaAccess } from './permissions';
import { registerNotificationIpc } from './notifications';
import { setupAutoUpdates } from './updates';

let mainWindow: ReturnType<typeof createMainWindow> | null = null;
const isCiLinux = process.platform === 'linux' && process.env.CI === 'true';

// 리눅스 CI에서는 Chromium 샌드박스와 GPU 초기화 때문에 창이 안 뜨는 경우가 있어서
// 자동화 실행에 필요한 스위치를 미리 켭니다.
if (isCiLinux) {
    app.commandLine.appendSwitch('no-sandbox');
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-dev-shm-usage');
}

// 메인 프로세스 크래시 방지
process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    log.error('Unhandled rejection:', reason);
});

app.setName('Slacord');

app.whenReady().then(() => {
    configurePermissions();
    registerNotificationIpc();
    ipcMain.handle('desktop:request-media-access', () => requestMediaAccess());
    mainWindow = createMainWindow();
    setupAutoUpdates(mainWindow);
    app.on('activate', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
        } else {
            mainWindow = createMainWindow();
            setupAutoUpdates(mainWindow);
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
