import { app, dialog, ipcMain, type BrowserWindow } from 'electron';
import type { DesktopUpdateCheckResult, DesktopUpdateStage } from '@slacord/contracts';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { attachUpdateWindow, getUpdateStatus, setUpdateProgress, setUpdateStatus } from './update-status';

const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 6;
const INITIAL_CHECK_DELAY_MS = 5000;

let configured = false;
let handlersRegistered = false;
let scheduled = false;
let runningCheck: Promise<DesktopUpdateCheckResult> | null = null;

export function setupAutoUpdates(window: BrowserWindow) {
    attachUpdateWindow(window);
    registerHandlers();
    if (!app.isPackaged || configured) return;
    configured = true;
    autoUpdater.logger = log;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => send('checking'));
    autoUpdater.on('update-available', (info) => send('available', `v${info.version}`));
    autoUpdater.on('update-not-available', () => {
        send('idle');
        setUpdateProgress(null);
    });
    autoUpdater.on('download-progress', (progress) => {
        setUpdateProgress(progress.percent / 100);
        send('downloading', `${Math.round(progress.percent)}%`);
    });
    autoUpdater.on('update-downloaded', async (info) => {
        setUpdateProgress(null);
        send('downloaded', `v${info.version}`);
        const choice = await dialog.showMessageBox({
            type: 'info',
            buttons: ['지금 재시작', '나중에'],
            defaultId: 0,
            message: `버전 ${info.version} 업데이트가 준비됐음.`,
            detail: '앱을 재시작하면 바로 최신 버전으로 올라감.',
        });
        if (choice.response === 0) autoUpdater.quitAndInstall();
    });
    autoUpdater.on('error', (error) => {
        setUpdateProgress(null);
        send('error', error.message);
    });
    scheduleChecks();
}

function registerHandlers() {
    if (handlersRegistered) return;
    handlersRegistered = true;
    ipcMain.handle('desktop:get-update-status', async () => getUpdateStatus());
    ipcMain.handle('desktop:check-for-updates', async () => checkForUpdates());
}

async function checkForUpdates(): Promise<DesktopUpdateCheckResult> {
    if (!app.isPackaged) {
        return { ok: false, status: { stage: 'idle', detail: '패키징된 앱에서만 업데이트 확인 가능' } };
    }
    if (runningCheck) return runningCheck;
    runningCheck = autoUpdater
        .checkForUpdates()
        .then(() => ({ ok: true, status: getUpdateStatus() }))
        .catch((error: Error) => {
            send('error', error.message);
            return { ok: false, status: getUpdateStatus() };
        })
        .finally(() => {
            runningCheck = null;
        });
    return runningCheck;
}

function scheduleChecks() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => void checkForUpdates(), INITIAL_CHECK_DELAY_MS);
    setInterval(() => void checkForUpdates(), CHECK_INTERVAL_MS);
}

function send(stage: DesktopUpdateStage, detail = '') {
    setUpdateStatus({ stage, detail });
}
