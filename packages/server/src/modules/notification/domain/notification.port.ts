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
    markAsRead(id: string): Promise<void>;
    markAllAsRead(teamId: string, recipientId: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
