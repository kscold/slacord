import { app, dialog, ipcMain, type BrowserWindow } from 'electron';
import type { DesktopUpdateStage } from '@slacord/contracts';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

export function setupAutoUpdates(window: BrowserWindow) {
    if (!app.isPackaged) return;
    autoUpdater.logger = log;
    autoUpdater.autoDownload = true;
    autoUpdater.on('checking-for-update', () => send(window, 'checking'));
    autoUpdater.on('update-available', (info) => send(window, 'available', info.version));
    autoUpdater.on('update-not-available', () => send(window, 'idle'));
    autoUpdater.on('download-progress', (progress) => {
        window.setProgressBar(progress.percent / 100);
        send(window, 'downloading', `${Math.round(progress.percent)}%`);
    });
    autoUpdater.on('update-downloaded', async (info) => {
        send(window, 'downloaded', info.version);
        const choice = await dialog.showMessageBox(window, {
            type: 'info',
            buttons: ['지금 재시작', '나중에'],
            defaultId: 0,
            message: `버전 ${info.version} 업데이트가 준비됐음.`,
            detail: '앱을 재시작하면 바로 최신 버전으로 올라감.',
        });
        if (choice.response === 0) autoUpdater.quitAndInstall();
    });
    autoUpdater.on('error', (error) => send(window, 'error', error.message));
    ipcMain.handle('desktop:check-for-updates', async () => autoUpdater.checkForUpdates());
    void autoUpdater.checkForUpdatesAndNotify();
}

function send(window: BrowserWindow, stage: DesktopUpdateStage, detail = '') {
    window.webContents.send('desktop:update-status', { stage, detail });
}
