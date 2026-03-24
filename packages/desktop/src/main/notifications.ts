import { Notification, ipcMain } from 'electron';
import { getNotificationIcon } from './config';

export function registerNotificationIpc() {
    ipcMain.handle('desktop:notify', (_event, payload: { title: string; body: string }) => {
        if (!Notification.isSupported()) return false;
        new Notification({ title: payload.title, body: payload.body, icon: getNotificationIcon() }).show();
        return true;
    });
}
