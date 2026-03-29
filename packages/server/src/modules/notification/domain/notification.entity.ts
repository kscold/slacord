export type NotificationType = 'mention' | 'issue_assigned' | 'issue_updated' | 'thread_reply';
export type NotificationResourceType = 'message' | 'issue';

export class NotificationEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly recipientId: string,
        public readonly type: NotificationType,
        public readonly actorId: string,
        public readonly actorName: string,
        public readonly content: string,
        public readonly resourceType: NotificationResourceType,
        public readonly resourceId: string,
        public readonly channelId: string | null,
        public readonly isRead: boolean,
        public readonly createdAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            recipientId: this.recipientId,
            type: this.type,
            actorId: this.actorId,
            actorName: this.actorName,
            content: this.content,
            resourceType: this.resourceType,
            resourceId: this.resourceId,
            channelId: this.channelId,
            isRead: this.isRead,
            createdAt: this.createdAt.toISOString(),
        };
    }
}
