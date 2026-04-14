import { desktopCapturer, shell, session, systemPreferences, type DesktopCapturerSource, type WebContents } from 'electron';
import { isAllowedUrl } from './config';

interface PermissionSession {
    setDisplayMediaRequestHandler: typeof session.defaultSession.setDisplayMediaRequestHandler;
    setPermissionCheckHandler: typeof session.defaultSession.setPermissionCheckHandler;
    setPermissionRequestHandler: typeof session.defaultSession.setPermissionRequestHandler;
}

interface DisplaySourceCapturer {
    getSources: typeof desktopCapturer.getSources;
}

export function pickDisplaySource(sources: DesktopCapturerSource[]) {
    return sources.find((source) => source.id.startsWith('screen:')) ?? sources[0] ?? null;
}

export function configurePermissions(targetSession: PermissionSession = session.defaultSession, capturer: DisplaySourceCapturer = desktopCapturer) {
    targetSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
        if (!isAllowedUrl(requestingOrigin)) return false;
        // 알림 + 미디어(마이크/카메라) 허용
        return permission === 'notifications' || permission === 'media';
    });
    targetSession.setPermissionRequestHandler((_wc, permission, callback, details) => {
        if (!isAllowedUrl(details.requestingUrl)) {
            callback(false);
            return;
        }
        if (permission === 'notifications' || permission === 'media' || permission === 'display-capture') {
            callback(true);
            return;
        }
        callback(false);
    });
    targetSession.setDisplayMediaRequestHandler(async (request, callback) => {
        if (!isAllowedUrl(request.securityOrigin) || !request.videoRequested) {
            callback({});
            return;
        }

        const source = pickDisplaySource(await capturer.getSources({
            types: ['screen', 'window'],
        }));

        if (!source) {
            callback({});
            return;
        }

        callback({
            video: {
                id: source.id,
                name: source.name,
            },
        });
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
