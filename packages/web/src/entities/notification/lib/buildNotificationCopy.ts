import type { AppNotification } from '../types';
import { getNotificationTypeLabel } from './getNotificationTypeLabel';

export function buildNotificationCopy(notification: AppNotification) {
    const actorName = notification.actorName || '팀 동료';
    const typeLabel = getNotificationTypeLabel(notification.type);
    const title = buildNotificationTitle(notification, actorName);
    const body = notification.content.trim() || `${typeLabel} 내용을 확인해 주세요.`;
    return { actorName, typeLabel, title, body };
}

function buildNotificationTitle(notification: AppNotification, actorName: string) {
    switch (notification.type) {
        case 'mention':
            return `${actorName}님이 멘션했어요`;
        case 'issue_assigned':
            return `${actorName}님이 이슈를 맡겼어요`;
        case 'issue_updated':
            return `${actorName}님이 이슈를 업데이트했어요`;
        case 'thread_reply':
            return `${actorName}님이 스레드에 답글을 남겼어요`;
        default:
            return `${actorName}님이 새 알림을 보냈어요`;
    }
}
