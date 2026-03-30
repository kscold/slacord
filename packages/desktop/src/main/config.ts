import path from 'path';
import { app } from 'electron';

const PROD_URL = 'https://slacord.cloud/auth/login';
const allowedHosts = ['slacord.cloud', 'www.slacord.cloud', 'localhost', '127.0.0.1'];

export function getStartUrl() {
    return process.env.SLACORD_DESKTOP_START_URL || process.env.SLACORD_APP_URL || PROD_URL;
}

export function getAppOrigin() {
    return new URL(getStartUrl()).origin;
}

export function isAllowedUrl(target: string) {
    try {
        const current = new URL(target);
        return allowedHosts.includes(current.hostname);
    } catch {
        return false;
    }
}

export function getPreloadPath() {
    return path.join(__dirname, 'preload.js');
}

export function getNotificationIcon() {
    if (app.isPackaged) return path.join(process.resourcesPath, 'assets', 'icon.png');
    return path.join(app.getAppPath(), 'build', 'icon.png');
}
