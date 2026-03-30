import { Inject, Injectable } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/notification.port';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification.port';
import { NotificationGateway } from '../../infrastructure/websocket/notification.gateway';

@Injectable()
export class MarkAllNotificationsAsReadUseCase {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
        private readonly notificationGateway: NotificationGateway,
    ) {}

    async execute(teamId: string, recipientId: string) {
        const updatedCount = await this.repo.markAllAsRead(teamId, recipientId);
        if (updatedCount > 0) {
            this.notificationGateway.emitNotificationsReadAll(teamId, recipientId);
        }
        return updatedCount;
    }
}
