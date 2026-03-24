import { BrowserWindow } from 'electron';
import { getPreloadPath, getStartUrl } from './config';
import { protectNavigation } from './permissions';

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
        },
    });
    protectNavigation(window.webContents);
    window.once('ready-to-show', () => window.show());
    void window.loadURL(getStartUrl());
    return window;
}
