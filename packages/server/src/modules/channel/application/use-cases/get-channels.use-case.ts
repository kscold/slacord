import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IChannelRepository } from '../../domain/channel.port';
import { CHANNEL_REPOSITORY } from '../../domain/channel.port';
import { ChannelEntity } from '../../domain/channel.entity';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';
import { CHANNEL_READ_REPOSITORY, type IChannelReadRepository } from '../../domain/channel-read.port';
import { Message, MessageDocument } from '../../../message/infrastructure/persistence/message.schema';

export interface ChannelListItem {
    channel: ChannelEntity;
    unreadCount: number;
    mentionCount: number;
    lastReadAt: Date | null;
    lastMessageAt: Date | null;
}

/** 팀의 채널 목록 조회 유스케이스 */
@Injectable()
export class GetChannelsUseCase {
    constructor(
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CHANNEL_READ_REPOSITORY) private readonly channelReadRepo: IChannelReadRepository,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    ) {}

    async execute(teamId: string, userId: string): Promise<ChannelListItem[]> {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.isMember(userId)) {
            return [];
        }
        const channels = await this.channelRepo.findByTeam(teamId);
        const visibleChannels = channels.filter(
            (channel) => channel.type === 'public' || channel.type === 'voice' || channel.isMember(userId),
        );
        const readStates = await this.channelReadRepo.findByChannelIdsForUser(
            visibleChannels.map((channel) => channel.id),
            userId,
        );
        const readStateByChannelId = new Map(readStates.map((state) => [state.channelId, state]));

        return Promise.all(
            visibleChannels.map(async (channel) => {
                const latestMessageAt = await this.findLatestMessageAt(channel.id);
                const currentState = readStateByChannelId.get(channel.id) ?? null;

                if (!currentState) {
                    const baselineReadAt = latestMessageAt ?? new Date();
                    await this.channelReadRepo.markRead({
                        teamId,
                        channelId: channel.id,
                        userId,
                        lastReadAt: baselineReadAt,
                    });

                    return {
                        channel,
                        unreadCount: 0,
                        mentionCount: 0,
                        lastReadAt: baselineReadAt,
                        lastMessageAt: latestMessageAt,
                    };
                }

                const unreadQuery = {
                    channelId: channel.id,
                    authorId: { $ne: userId },
                    createdAt: { $gt: currentState.lastReadAt },
                };

                const [unreadCount, mentionCount] = await Promise.all([
                    this.messageModel.countDocuments(unreadQuery),
                    this.messageModel.countDocuments({ ...unreadQuery, mentions: userId }),
                ]);

                return {
                    channel,
                    unreadCount,
                    mentionCount,
                    lastReadAt: currentState.lastReadAt,
                    lastMessageAt: latestMessageAt,
                };
            }),
        );
    }

    private async findLatestMessageAt(channelId: string): Promise<Date | null> {
        const latest = await this.messageModel
            .findOne({ channelId })
            .sort({ createdAt: -1 })
            .select({ createdAt: 1 })
            .lean();

        return latest?.createdAt ?? null;
    }
}
