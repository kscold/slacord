import { app, ipcMain } from 'electron';
import log from 'electron-log';
import { createMainWindow } from './window';
import { configurePermissions, requestMediaAccess } from './permissions';
import { registerNotificationIpc } from './notifications';
import { setupAutoUpdates } from './updates';

let mainWindow: ReturnType<typeof createMainWindow> | null = null;

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
