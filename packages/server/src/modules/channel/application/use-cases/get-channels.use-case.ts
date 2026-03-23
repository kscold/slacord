import { Inject, Injectable } from '@nestjs/common';
import type { IChannelRepository } from '../../domain/channel.port';
import { CHANNEL_REPOSITORY } from '../../domain/channel.port';
import { ChannelEntity } from '../../domain/channel.entity';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';

/** 팀의 채널 목록 조회 유스케이스 */
@Injectable()
export class GetChannelsUseCase {
    constructor(
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    async execute(teamId: string, userId: string): Promise<ChannelEntity[]> {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.isMember(userId)) {
            return [];
        }
        const channels = await this.channelRepo.findByTeam(teamId);
        return channels.filter((channel) => channel.type === 'public' || channel.isMember(userId));
    }
}
