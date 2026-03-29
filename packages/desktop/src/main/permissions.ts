import { shell, session, systemPreferences, type WebContents } from 'electron';
import { isAllowedUrl } from './config';

export function configurePermissions() {
    session.defaultSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
        if (!isAllowedUrl(requestingOrigin)) return false;
        // 알림 + 미디어(마이크/카메라) 허용
        return permission === 'notifications' || permission === 'media';
    });
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback, details) => {
        if (!isAllowedUrl(details.requestingUrl)) {
            callback(false);
            return;
        }
        if (permission === 'notifications' || permission === 'media') {
            callback(true);
            return;
        }
        callback(false);
    });
}

/** macOS 마이크/카메라 시스템 권한 요청 */
export async function requestMediaAccess(): Promise<{ microphone: boolean; camera: boolean }> {
    if (process.platform !== 'darwin') {
        return { microphone: true, camera: true };
    }
    const microphone = await systemPreferences.askForMediaAccess('microphone');
    const camera = await systemPreferences.askForMediaAccess('camera');
    return { microphone, camera };
}

export function protectNavigation(contents: WebContents) {
    contents.setWindowOpenHandler(({ url }) => {
        if (isAllowedUrl(url)) return { action: 'allow' };
        void shell.openExternal(url);
        return { action: 'deny' };
    });
    contents.on('will-navigate', (event, url) => {
        if (!isAllowedUrl(url)) {
            event.preventDefault();
            void shell.openExternal(url);
        }
    });
}
