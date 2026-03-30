import type { AppNotification } from '@/src/entities/notification/types';
import { buildNotificationCopy } from '@/src/entities/notification/lib/buildNotificationCopy';
import { resolveNotificationHref } from '@/src/entities/notification/lib/resolveNotificationHref';
import { showDesktopMessageNotification } from '@/src/shared/lib/desktop-notifications';

export async function notifyAppNotification(notification: AppNotification) {
    const copy = buildNotificationCopy(notification);
    await showDesktopMessageNotification({
        title: copy.title,
        body: copy.body,
        force: typeof window !== 'undefined' && !!window.slacordDesktop?.isDesktop,
        href: resolveNotificationHref(notification.teamId, notification),
    });
}
