import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ITeamRepository } from '../../domain/team.port';
import { TEAM_REPOSITORY } from '../../domain/team.port';
import { TeamEntity } from '../../domain/team.entity';
import { CLOCK, type Clock } from '../../../../shared/lib/clock';

export interface JoinTeamInput {
    slug: string;
    userId: string;
}

/** 팀 참여 유스케이스 */
@Injectable()
export class JoinTeamUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    async execute(input: JoinTeamInput): Promise<TeamEntity> {
        const team = await this.teamRepo.findBySlug(input.slug);
        if (!team) {
            throw new BadRequestException('존재하지 않는 팀입니다.');
        }
        if (team.isMember(input.userId)) {
            throw new BadRequestException('이미 팀에 참여 중입니다.');
        }

        return this.teamRepo.addMember(team.id, {
            userId: input.userId,
            role: 'member',
            joinedAt: this.clock.now(),
            canManageInvites: false,
        });
    }
}
