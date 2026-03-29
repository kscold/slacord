export type NotificationType = 'mention' | 'issue_assigned' | 'issue_updated' | 'thread_reply';

export interface AppNotification {
    id: string;
    teamId: string;
    recipientId: string;
    type: NotificationType;
    actorId: string;
    actorName: string;
    content: string;
    resourceType: 'message' | 'issue';
    resourceId: string;
    channelId: string | null;
    isRead: boolean;
    createdAt: string;
}
