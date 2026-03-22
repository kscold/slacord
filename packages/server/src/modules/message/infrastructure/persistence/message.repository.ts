import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMessageRepository } from '../../domain/message.port';
import { MessageEntity, MessageType, Attachment } from '../../domain/message.entity';
import { Message, MessageDocument } from './message.schema';

/** Message Repository Adapter - MongoDB 구현체 */
@Injectable()
export class MessageRepository implements IMessageRepository {
    constructor(@InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>) {}

    async findByChannel(channelId: string, limit: number, before?: Date): Promise<MessageEntity[]> {
        const query: any = { channelId };
        if (before) {
            query.createdAt = { $lt: before };
        }
        const docs = await this.messageModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
        return docs.reverse().map((doc) => this.toEntity(doc));
    }

    async save(data: {
        teamId: string;
        channelId: string;
        authorId: string;
        content: string;
        type: MessageType;
        attachments: Attachment[];
        replyToId: string | null;
    }): Promise<MessageEntity> {
        const doc = await this.messageModel.create(data);
        return this.toEntity(doc.toObject());
    }

    private toEntity(doc: any): MessageEntity {
        return new MessageEntity(
            doc._id.toString(),
            doc.teamId.toString(),
            doc.channelId.toString(),
            doc.authorId,
            doc.content,
            doc.type as MessageType,
            doc.attachments ?? [],
            doc.replyToId?.toString() ?? null,
            doc.createdAt,
        );
    }
}
