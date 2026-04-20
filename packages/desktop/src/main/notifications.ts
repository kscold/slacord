import { app, BrowserWindow, Notification, ipcMain } from 'electron';
import { getAppOrigin, getNotificationIcon } from './config';

export function registerNotificationIpc() {
    ipcMain.handle('desktop:notify', (_event, payload: unknown) => {
        if (typeof payload !== 'object' || payload === null) return false;
        const { title, body, href } = payload as Record<string, unknown>;
        if (typeof title !== 'string' || typeof body !== 'string') return false;
        if (!Notification.isSupported()) return false;
        try {
            const notification = new Notification({
                title: title.slice(0, 200),
                body: body.slice(0, 500),
                icon: getNotificationIcon(),
                silent: false,
                urgency: 'critical',
            });

            // 한 알림은 한 번만 클릭될 수 있으므로 once로 등록 — 자동 해제로 리스너 누수 방지
            notification.once('click', () => {
                const win = BrowserWindow.getAllWindows()[0];
                if (!win) return;
                if (typeof href === 'string' && href.startsWith('/')) {
                    void win.loadURL(new URL(href, getAppOrigin()).toString());
                }
                if (win.isMinimized()) win.restore();
                win.show();
                win.focus();
            });

            // 클릭 없이 dismiss된 경우에도 리스너 정리 보장
            notification.once('close', () => notification.removeAllListeners());

            notification.show();

            // macOS: 앱이 포커스가 아닐 때 Dock 바운스
            const win = BrowserWindow.getAllWindows()[0];
            if (process.platform === 'darwin' && (!win || !win.isFocused())) {
                app.dock?.bounce('informational');
            }

            return true;
        } catch {
            return false;
        }
    });
}
