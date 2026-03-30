import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';
import type { INotificationRepository } from '../../domain/notification.port';
import { NotificationEntity, type NotificationType, type NotificationResourceType } from '../../domain/notification.entity';

@Injectable()
export class NotificationRepository implements INotificationRepository {
    constructor(@InjectModel(Notification.name) private readonly model: Model<Notification>) {}

    private toEntity(doc: Notification): NotificationEntity {
        return new NotificationEntity(
            (doc._id as any).toString(),
            doc.teamId,
            doc.recipientId,
            doc.type as NotificationType,
            doc.actorId,
            doc.actorName,
            doc.content,
            doc.resourceType as NotificationResourceType,
            doc.resourceId,
            doc.channelId,
            doc.isRead,
            (doc as any).createdAt,
        );
    }

    async findByRecipient(teamId: string, recipientId: string, limit: number): Promise<NotificationEntity[]> {
        const docs = await this.model.find({ teamId, recipientId }).sort({ createdAt: -1 }).limit(limit).exec();
        return docs.map((d) => this.toEntity(d));
    }

    async countUnread(teamId: string, recipientId: string): Promise<number> {
        return this.model.countDocuments({ teamId, recipientId, isRead: false }).exec();
    }

    async save(data: {
        teamId: string; recipientId: string; type: NotificationType; actorId: string; actorName: string;
        content: string; resourceType: NotificationResourceType; resourceId: string; channelId: string | null;
    }): Promise<NotificationEntity> {
        const doc = await this.model.create(data);
        return this.toEntity(doc);
    }

    async markAsRead(id: string, recipientId: string): Promise<NotificationEntity | null> {
        const doc = await this.model
            .findOneAndUpdate({ _id: id, recipientId, isRead: false }, { isRead: true }, { new: true })
            .exec();
        return doc ? this.toEntity(doc) : null;
    }

    async markAllAsRead(teamId: string, recipientId: string): Promise<number> {
        const result = await this.model
            .updateMany({ teamId, recipientId, isRead: false }, { isRead: true })
            .exec();
        return result.modifiedCount ?? 0;
    }
}
