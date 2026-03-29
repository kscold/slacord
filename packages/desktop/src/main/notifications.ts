import { app, BrowserWindow, Notification, ipcMain } from 'electron';
import { getNotificationIcon } from './config';

export function registerNotificationIpc() {
    ipcMain.handle('desktop:notify', (_event, payload: unknown) => {
        if (typeof payload !== 'object' || payload === null) return false;
        const { title, body } = payload as Record<string, unknown>;
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

            // 알림 클릭 시 앱 포커스
            notification.on('click', () => {
                const win = BrowserWindow.getAllWindows()[0];
                if (win) {
                    if (win.isMinimized()) win.restore();
                    win.show();
                    win.focus();
                }
            });

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
