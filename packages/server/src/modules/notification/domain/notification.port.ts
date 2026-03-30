import { NotificationEntity, NotificationType, NotificationResourceType } from './notification.entity';

export interface INotificationRepository {
    findByRecipient(teamId: string, recipientId: string, limit: number): Promise<NotificationEntity[]>;
    countUnread(teamId: string, recipientId: string): Promise<number>;
    save(data: {
        teamId: string;
        recipientId: string;
        type: NotificationType;
        actorId: string;
        actorName: string;
        content: string;
        resourceType: NotificationResourceType;
        resourceId: string;
        channelId: string | null;
    }): Promise<NotificationEntity>;
    markAsRead(id: string, recipientId: string): Promise<NotificationEntity | null>;
    markAllAsRead(teamId: string, recipientId: string): Promise<number>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
