/**
 * 알림 트리거 도메인 이벤트.
 *
 * 비즈니스 use case는 이 이벤트만 emit하고,
 * NotificationEventListener가 수신해서 실제 알림을 생성한다.
 *
 * 장점:
 * - Issue/Message/Document 모듈이 NotificationModule에 의존하지 않음
 * - 알림 실패가 본래 비즈니스 로직에 영향 주지 않음
 * - 알림 정책 변경 시 한 곳(리스너)만 수정
 */

export const NOTIFICATION_EVENTS = {
    MENTIONED: 'notification.mentioned',
    THREAD_REPLIED: 'notification.thread_replied',
    ISSUE_ASSIGNED: 'notification.issue_assigned',
} as const;

export interface MentionedEvent {
    teamId: string;
    recipientIds: string[];
    actorId: string;
    actorName: string;
    content: string;
    resourceType: 'message' | 'document';
    resourceId: string;
    channelId?: string | null;
}

export interface ThreadRepliedEvent {
    teamId: string;
    recipientId: string;
    actorId: string;
    actorName: string;
    content: string;
    resourceType: 'message' | 'document';
    resourceId: string;
    channelId?: string | null;
}

export interface IssueAssignedEvent {
    teamId: string;
    recipientIds: string[];
    actorId: string;
    issueId: string;
    issueTitle: string;
}
