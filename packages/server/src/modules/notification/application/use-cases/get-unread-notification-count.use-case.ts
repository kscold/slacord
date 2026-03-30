import { Inject, Injectable } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/notification.port';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification.port';

@Injectable()
export class GetUnreadNotificationCountUseCase {
    constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}

    async execute(teamId: string, recipientId: string) {
        return this.repo.countUnread(teamId, recipientId);
    }
}
