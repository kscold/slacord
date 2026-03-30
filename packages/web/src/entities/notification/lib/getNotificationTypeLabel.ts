import type { NotificationType } from '../types';

const TYPE_LABELS: Record<NotificationType, string> = {
    mention: '멘션',
    issue_assigned: '이슈 할당',
    issue_updated: '이슈 변경',
    thread_reply: '스레드 답글',
};

export function getNotificationTypeLabel(type: NotificationType) {
    return TYPE_LABELS[type] ?? '알림';
}
