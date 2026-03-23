import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { IChannelRepository } from '../../domain/channel.port';
import { CHANNEL_REPOSITORY } from '../../domain/channel.port';
import { ChannelEntity, ChannelType } from '../../domain/channel.entity';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';

export interface CreateChannelInput {
    teamId: string;
    name: string;
    description?: string;
    type?: ChannelType;
    createdBy: string;
    memberIds?: string[];
}

/** 채널 생성 유스케이스 */
@Injectable()
export class CreateChannelUseCase {
    constructor(
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    async execute(input: CreateChannelInput): Promise<ChannelEntity> {
        const team = await this.teamRepo.findById(input.teamId);
        const type = input.type ?? 'public';
        const memberIds = [...new Set([input.createdBy, ...(input.memberIds ?? [])])];

        if (!team || !team.isMember(input.createdBy)) {
            throw new BadRequestException('채널을 만들 수 있는 팀 멤버가 아닙니다.');
        }
        if (memberIds.some((userId) => !team.isMember(userId))) {
            throw new BadRequestException('팀에 속하지 않은 멤버가 포함되어 있습니다.');
        }
        if (type === 'dm' && memberIds.length !== 2) {
            throw new BadRequestException('DM은 정확히 2명의 멤버로 생성해야 합니다.');
        }
        if (type === 'group' && memberIds.length < 3) {
            throw new BadRequestException('소그룹은 3명 이상이어야 합니다.');
        }
        if (type === 'dm') {
            const existing = await this.channelRepo.findDirectChannel(input.teamId, memberIds);
            if (existing) {
                return existing;
            }
        }
        if (type === 'public' || type === 'private') {
            const exists = await this.channelRepo.existsByNameInTeam(input.teamId, input.name);
            if (exists) {
                throw new BadRequestException('같은 이름의 채널이 이미 존재합니다.');
            }
        }

        return this.channelRepo.save({
            teamId: input.teamId,
            name: input.name,
            description: input.description ?? null,
            type,
            createdBy: input.createdBy,
            memberIds: type === 'public' ? [input.createdBy] : memberIds,
        });
    }
}
