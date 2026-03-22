import { Inject, Injectable } from '@nestjs/common';
import type { IChannelRepository } from '../../domain/channel.port';
import { CHANNEL_REPOSITORY } from '../../domain/channel.port';
import { ChannelEntity } from '../../domain/channel.entity';

/** 팀의 채널 목록 조회 유스케이스 */
@Injectable()
export class GetChannelsUseCase {
    constructor(@Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository) {}

    async execute(teamId: string): Promise<ChannelEntity[]> {
        return this.channelRepo.findByTeam(teamId);
    }
}
