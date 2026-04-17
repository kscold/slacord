import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChannelReadEntity } from '../../domain/channel-read.entity';
import { IChannelReadRepository } from '../../domain/channel-read.port';
import { ChannelRead, ChannelReadDocument } from './channel-read.schema';

@Injectable()
export class ChannelReadRepository implements IChannelReadRepository {
    constructor(@InjectModel(ChannelRead.name) private readonly channelReadModel: Model<ChannelReadDocument>) {}

    async findByChannelIdsForUser(channelIds: string[], userId: string): Promise<ChannelReadEntity[]> {
        if (channelIds.length === 0) return [];
        const docs = await this.channelReadModel.find({ channelId: { $in: channelIds }, userId }).lean();
        return docs.map((doc) => this.toEntity(doc));
    }

    async markRead(data: {
        teamId: string;
        channelId: string;
        userId: string;
        lastReadAt: Date;
    }): Promise<ChannelReadEntity> {
        const doc = await this.channelReadModel
            .findOneAndUpdate(
                { channelId: data.channelId, userId: data.userId },
                {
                    teamId: data.teamId,
                    channelId: data.channelId,
                    userId: data.userId,
                    lastReadAt: data.lastReadAt,
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                },
            )
            .lean();

        return this.toEntity(doc!);
    }

    private toEntity(doc: ChannelReadDocument): ChannelReadEntity {
        return new ChannelReadEntity(
            String(doc._id),
            doc.teamId,
            doc.channelId,
            doc.userId,
            doc.lastReadAt,
            doc.updatedAt ?? doc.createdAt ?? doc.lastReadAt,
        );
    }
}
