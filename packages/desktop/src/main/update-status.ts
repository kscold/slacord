import type { DesktopUpdateStatus } from '@slacord/contracts';
import type { BrowserWindow } from 'electron';

const windows = new Set<BrowserWindow>();
let currentStatus: DesktopUpdateStatus = {
    stage: 'idle',
    detail: '',
    progress: null,
    availableVersion: null,
    manualDownloadRequired: false,
};

export function attachUpdateWindow(window: BrowserWindow) {
    windows.add(window);
    window.once('closed', () => windows.delete(window));
    pushUpdateStatus(window, currentStatus);
}

export function getUpdateStatus() {
    return currentStatus;
}

export function setUpdateStatus(status: DesktopUpdateStatus) {
    currentStatus = status;
    for (const window of windows) {
        pushUpdateStatus(window, status);
    }
}

export function setUpdateProgress(progress: number | null) {
    for (const window of windows) {
        if (!window.isDestroyed()) window.setProgressBar(progress ?? -1);
    }
}

function pushUpdateStatus(window: BrowserWindow, status: DesktopUpdateStatus) {
    if (!window.isDestroyed()) {
        window.webContents.send('desktop:update-status', status);
    }
}
