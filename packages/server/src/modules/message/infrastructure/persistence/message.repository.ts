import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMessageRepository } from '../../domain/message.port';
import { MessageEntity, MessageType, Attachment, Reaction } from '../../domain/message.entity';
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

    async findById(id: string): Promise<MessageEntity | null> {
        const doc = await this.messageModel.findById(id).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findThreadReplies(parentId: string): Promise<MessageEntity[]> {
        const docs = await this.messageModel.find({ replyToId: parentId }).sort({ createdAt: 1 }).lean();
        return docs.map((doc) => this.toEntity(doc));
    }

    async findPinnedByChannel(channelId: string): Promise<MessageEntity[]> {
        const docs = await this.messageModel.find({ channelId, isPinned: true }).sort({ pinnedAt: -1 }).lean();
        return docs.map((doc) => this.toEntity(doc));
    }

    async save(data: {
        teamId: string;
        channelId: string;
        authorId: string;
        authorName: string | null;
        content: string;
        type: MessageType;
        attachments: Attachment[];
        replyToId: string | null;
        mentions: string[];
    }): Promise<MessageEntity> {
        const doc = await this.messageModel.create(data);
        return this.toEntity(doc.toObject());
    }

    async updateContent(id: string, content: string): Promise<MessageEntity | null> {
        const doc = await this.messageModel
            .findByIdAndUpdate(id, { content, isEdited: true }, { new: true })
            .lean();
        return doc ? this.toEntity(doc) : null;
    }

    async setPinned(id: string, isPinned: boolean): Promise<MessageEntity | null> {
        const doc = await this.messageModel
            .findByIdAndUpdate(
                id,
                { isPinned, pinnedAt: isPinned ? new Date() : null },
                { new: true },
            )
            .lean();
        return doc ? this.toEntity(doc) : null;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.messageModel.findByIdAndDelete(id);
        return result !== null;
    }

    async toggleReaction(id: string, emoji: string, userId: string): Promise<MessageEntity | null> {
        const doc = await this.messageModel.findById(id);
        if (!doc) return null;

        const existing = doc.reactions.find((r: any) => r.emoji === emoji);
        if (existing) {
            const idx = existing.userIds.indexOf(userId);
            if (idx >= 0) {
                existing.userIds.splice(idx, 1);
                if (existing.userIds.length === 0) {
                    doc.reactions = doc.reactions.filter((r: any) => r.emoji !== emoji);
                }
            } else {
                existing.userIds.push(userId);
            }
        } else {
            doc.reactions.push({ emoji, userIds: [userId] } as any);
        }

        await doc.save();
        return this.toEntity(doc.toObject());
    }

    async findByExternalRef(channelId: string, source: string, externalId: string): Promise<MessageEntity | null> {
        const doc = await this.messageModel.findOne({ channelId, externalSource: source, externalId }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async saveImported(data: {
        teamId: string; channelId: string; authorId: string; authorName: string | null;
        content: string; type: MessageType; attachments: Attachment[]; replyToId: string | null;
        mentions: string[]; externalSource: string; externalId: string;
        createdAt: Date; updatedAt: Date; isPinned: boolean; pinnedAt: Date | null;
    }): Promise<MessageEntity> {
        const created = await this.messageModel.create(data);
        return this.toEntity(created.toObject());
    }

    private toEntity(doc: any): MessageEntity {
        return new MessageEntity(
            doc._id.toString(),
            doc.teamId.toString(),
            doc.channelId.toString(),
            doc.authorId,
            doc.authorName ?? null,
            doc.content,
            doc.type as MessageType,
            doc.attachments ?? [],
            doc.replyToId?.toString() ?? null,
            (doc.reactions ?? []) as Reaction[],
            doc.mentions ?? [],
            doc.externalSource ?? null,
            doc.externalId ?? null,
            doc.isEdited ?? false,
            doc.isPinned ?? false,
            doc.pinnedAt ?? null,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
