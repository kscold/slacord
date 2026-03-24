import { app } from 'electron';
import { createMainWindow } from './window';
import { configurePermissions } from './permissions';
import { registerNotificationIpc } from './notifications';
import { setupAutoUpdates } from './updates';

let mainWindow: ReturnType<typeof createMainWindow> | null = null;

app.setName('Slacord');

app.whenReady().then(() => {
    configurePermissions();
    registerNotificationIpc();
    mainWindow = createMainWindow();
    setupAutoUpdates(mainWindow);
    app.on('activate', () => {
        if (mainWindow === null) mainWindow = createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
