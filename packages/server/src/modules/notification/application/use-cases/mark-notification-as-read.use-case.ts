import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/notification.port';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification.port';
import { NotificationGateway } from '../../infrastructure/websocket/notification.gateway';

@Injectable()
export class MarkNotificationAsReadUseCase {
    constructor(
        @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
        private readonly notificationGateway: NotificationGateway,
    ) {}

    async execute(id: string, recipientId: string) {
        const notification = await this.repo.markAsRead(id, recipientId);
        if (!notification) {
            throw new BadRequestException('읽음 처리할 알림을 찾을 수 없습니다.');
        }
        this.notificationGateway.emitNotificationRead(notification.teamId, notification.recipientId, notification.id);
        return notification;
    }
}
