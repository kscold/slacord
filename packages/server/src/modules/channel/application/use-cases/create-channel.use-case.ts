import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { IChannelRepository } from '../../domain/channel.port';
import { CHANNEL_REPOSITORY } from '../../domain/channel.port';
import { ChannelEntity, ChannelType } from '../../domain/channel.entity';

export interface CreateChannelInput {
    teamId: string;
    name: string;
    description?: string;
    type?: ChannelType;
    createdBy: string;
}

/** 채널 생성 유스케이스 */
@Injectable()
export class CreateChannelUseCase {
    constructor(@Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository) {}

    async execute(input: CreateChannelInput): Promise<ChannelEntity> {
        const exists = await this.channelRepo.existsByNameInTeam(input.teamId, input.name);
        if (exists) {
            throw new BadRequestException('같은 이름의 채널이 이미 존재합니다.');
        }

        return this.channelRepo.save({
            teamId: input.teamId,
            name: input.name,
            description: input.description ?? null,
            type: input.type ?? 'public',
            createdBy: input.createdBy,
            memberIds: [input.createdBy],
        });
    }
}
