import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IChannelRepository } from '../../domain/channel.port';
import { ChannelEntity, ChannelType } from '../../domain/channel.entity';
import { Channel, ChannelDocument } from './channel.schema';

/** Channel Repository Adapter - MongoDB 구현체 */
@Injectable()
export class ChannelRepository implements IChannelRepository {
    constructor(@InjectModel(Channel.name) private readonly channelModel: Model<ChannelDocument>) {}

    async findById(id: string): Promise<ChannelEntity | null> {
        const doc = await this.channelModel.findById(id).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findByTeam(teamId: string): Promise<ChannelEntity[]> {
        const docs = await this.channelModel.find({ teamId }).lean();
        return docs.map((doc) => this.toEntity(doc));
    }

    async findDirectChannel(teamId: string, memberIds: string[]): Promise<ChannelEntity | null> {
        const doc = await this.channelModel.findOne({
            teamId,
            type: 'dm',
            memberIds: { $all: memberIds, $size: memberIds.length },
        }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async save(data: {
        teamId: string;
        name: string;
        description: string | null;
        type: ChannelType;
        createdBy: string;
        memberIds: string[];
    }): Promise<ChannelEntity> {
        const doc = await this.channelModel.create(data);
        return this.toEntity(doc.toObject());
    }

    async addMember(channelId: string, userId: string): Promise<ChannelEntity> {
        const doc = await this.channelModel
            .findByIdAndUpdate(channelId, { $addToSet: { memberIds: userId } }, { new: true })
            .lean();
        return this.toEntity(doc!);
    }

    async existsByNameInTeam(teamId: string, name: string): Promise<boolean> {
        return !!(await this.channelModel.exists({ teamId, name }));
    }

    private toEntity(doc: any): ChannelEntity {
        return new ChannelEntity(
            doc._id.toString(),
            doc.teamId.toString(),
            doc.name,
            doc.description,
            doc.type as ChannelType,
            doc.createdBy,
            doc.memberIds ?? [],
            doc.createdAt,
        );
    }
}
