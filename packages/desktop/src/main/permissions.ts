import { shell, session, type WebContents } from 'electron';
import { isAllowedUrl } from './config';

export function configurePermissions() {
    session.defaultSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
        return permission === 'notifications' && isAllowedUrl(requestingOrigin);
    });
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback, details) => {
        callback(permission === 'notifications' && isAllowedUrl(details.requestingUrl));
    });
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
