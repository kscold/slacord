import type { AppNotification } from '../types';

export function resolveNotificationHref(teamId: string, notification: AppNotification) {
    if (notification.resourceType === 'issue') {
        return `/${teamId}/issues?issue=${notification.resourceId}`;
    }

    if (notification.channelId) {
        return `/${teamId}/channel/${notification.channelId}`;
    }

    return `/${teamId}`;
}
