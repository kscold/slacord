import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CHANNEL_REPOSITORY, type IChannelRepository } from '../../domain/channel.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import { CHANNEL_READ_REPOSITORY, type IChannelReadRepository } from '../../domain/channel-read.port';
import { ChannelReadEntity } from '../../domain/channel-read.entity';
import { Message, MessageDocument } from '../../../message/infrastructure/persistence/message.schema';
import { CLOCK, type Clock } from '../../../../shared/lib/clock';

@Injectable()
export class MarkChannelAsReadUseCase {
    constructor(
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CHANNEL_READ_REPOSITORY) private readonly channelReadRepo: IChannelReadRepository,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    async execute(channelId: string, userId: string): Promise<ChannelReadEntity> {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel) {
            throw new NotFoundException('채널을 찾을 수 없습니다.');
        }

        const team = await this.teamRepo.findById(channel.teamId);
        if (!team || !team.isMember(userId)) {
            throw new ForbiddenException('채널에 접근할 수 없습니다.');
        }

        const canAccess = channel.type === 'public' || channel.type === 'voice' || channel.isMember(userId);

        if (!canAccess) {
            throw new ForbiddenException('채널에 접근할 수 없습니다.');
        }

        const latestMessage = await this.messageModel
            .findOne({ channelId })
            .sort({ createdAt: -1 })
            .select({ createdAt: 1 })
            .lean();

        const lastReadAt = latestMessage?.createdAt ?? this.clock.now();

        return this.channelReadRepo.markRead({
            teamId: channel.teamId,
            channelId,
            userId,
            lastReadAt,
        });
    }
}
