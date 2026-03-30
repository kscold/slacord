import type { AppNotification } from '@/src/entities/notification/types';
import { showDesktopMessageNotification } from '@/src/shared/lib/desktop-notifications';

const TYPE_LABELS: Record<AppNotification['type'], string> = {
    mention: '멘션',
    issue_assigned: '이슈 할당',
    issue_updated: '이슈 변경',
    thread_reply: '스레드 답글',
};

export async function notifyAppNotification(notification: AppNotification) {
    const title = `${TYPE_LABELS[notification.type] ?? '알림'} · ${notification.actorName || 'Slacord'}`;
    await showDesktopMessageNotification({
        title,
        body: notification.content,
        force: typeof window !== 'undefined' && !!window.slacordDesktop?.isDesktop,
    });
}
