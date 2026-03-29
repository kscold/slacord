import { Inject, Injectable } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/notification.port';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification.port';
import type { NotificationType, NotificationResourceType } from '../../domain/notification.entity';

export interface CreateNotificationInput {
    teamId: string;
    recipientId: string;
    type: NotificationType;
    actorId: string;
    actorName: string;
    content: string;
    resourceType: NotificationResourceType;
    resourceId: string;
    channelId?: string | null;
}

@Injectable()
export class CreateNotificationUseCase {
    constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}

    async execute(input: CreateNotificationInput) {
        // 자기 자신에게는 알림 안 보냄
        if (input.recipientId === input.actorId) return null;
        return this.repo.save({ ...input, channelId: input.channelId ?? null });
    }

    async executeBulk(inputs: CreateNotificationInput[]) {
        const filtered = inputs.filter((i) => i.recipientId !== i.actorId);
        return Promise.all(filtered.map((i) => this.repo.save({ ...i, channelId: i.channelId ?? null })));
    }
}
