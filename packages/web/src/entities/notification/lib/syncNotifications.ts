import type { AppNotification } from '../types';

export function prependNotification(
    notifications: AppNotification[],
    notification: AppNotification,
) {
    return [notification, ...notifications.filter((item) => item.id !== notification.id)].slice(0, 50);
}

export function applyNotificationRead(
    notifications: AppNotification[],
    notificationId: string,
) {
    return notifications.map((item) => (
        item.id === notificationId ? { ...item, isRead: true } : item
    ));
}

export function applyNotificationReadAll(notifications: AppNotification[]) {
    return notifications.map((item) => ({ ...item, isRead: true }));
}
