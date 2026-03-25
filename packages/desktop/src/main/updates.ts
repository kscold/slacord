import { app, BrowserWindow, dialog, ipcMain, type BrowserWindow as BrowserWindowType } from 'electron';
import type { DesktopUpdateCheckResult, DesktopUpdateInstallResult, DesktopUpdateStage } from '@slacord/contracts';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { attachUpdateWindow, getUpdateStatus, setUpdateProgress, setUpdateStatus } from './update-status';

const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 6;
const INITIAL_CHECK_DELAY_MS = 5000;

let configured = false;
let handlersRegistered = false;
let scheduled = false;
let downloadedVersion = '';
let installRequested = false;
let runningCheck: Promise<DesktopUpdateCheckResult> | null = null;

export function setupAutoUpdates(window: BrowserWindowType) {
    attachUpdateWindow(window);
    registerHandlers();
    if (!app.isPackaged || configured) return;
    configured = true;
    autoUpdater.logger = log;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoRunAppAfterInstall = true;
    autoUpdater.on('checking-for-update', () => send('checking'));
    autoUpdater.on('update-available', (info) => send('available', `v${info.version}`));
    autoUpdater.on('update-not-available', () => {
        downloadedVersion = '';
        send('idle');
        setUpdateProgress(null);
    });
    autoUpdater.on('download-progress', (progress) => {
        setUpdateProgress(progress.percent / 100);
        send('downloading', `${Math.round(progress.percent)}%`);
    });
    autoUpdater.on('update-downloaded', async (info) => {
        downloadedVersion = info.version;
        setUpdateProgress(null);
        send('downloaded', `v${info.version}`);
        const choice = await dialog.showMessageBox({
            type: 'info',
            buttons: ['지금 재시작', '나중에'],
            defaultId: 0,
            message: `버전 ${info.version} 업데이트를 설치할 준비가 끝났습니다.`,
            detail: '지금 재시작하면 최신 버전으로 바로 전환됩니다.',
        });
        if (choice.response === 0) await restartToInstall();
    });
    autoUpdater.on('error', (error) => {
        setUpdateProgress(null);
        installRequested = false;
        send('error', error.message);
    });
    scheduleChecks();
}

function registerHandlers() {
    if (handlersRegistered) return;
    handlersRegistered = true;
    ipcMain.handle('desktop:get-update-status', async () => getUpdateStatus());
    ipcMain.handle('desktop:check-for-updates', async () => checkForUpdates());
    ipcMain.handle('desktop:restart-to-update', async () => restartToInstall());
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

async function restartToInstall(): Promise<DesktopUpdateInstallResult> {
    if (!app.isPackaged) {
        return { ok: false, status: { stage: 'idle', detail: '패키징된 앱에서만 설치할 수 있습니다.' } };
    }
    if (!downloadedVersion) {
        return { ok: false, status: { stage: 'idle', detail: '설치할 업데이트가 아직 준비되지 않았습니다.' } };
    }
    if (installRequested) {
        return { ok: true, status: getUpdateStatus() };
    }

    installRequested = true;
    setUpdateProgress(null);
    send('installing', `v${downloadedVersion}`);
    const windows = BrowserWindow.getAllWindows();
    for (const window of windows) {
        if (!window.isDestroyed()) window.webContents.send('desktop:update-status', getUpdateStatus());
    }
    setImmediate(() => {
        try {
            for (const window of windows) {
                if (!window.isDestroyed()) window.hide();
            }
            autoUpdater.quitAndInstall(false, true);
        } catch (error) {
            installRequested = false;
            send('error', error instanceof Error ? error.message : '업데이트 설치를 시작하지 못했습니다.');
        }
    });
    return { ok: true, status: getUpdateStatus() };
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
