import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ITeamRepository } from '../../domain/team.port';
import { TEAM_REPOSITORY } from '../../domain/team.port';
import { TeamEntity } from '../../domain/team.entity';

export interface CreateTeamInput {
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
}

/** 팀 생성 유스케이스 */
@Injectable()
export class CreateTeamUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(input: CreateTeamInput): Promise<TeamEntity> {
        const exists = await this.teamRepo.existsBySlug(input.slug);
        if (exists) {
            throw new BadRequestException('이미 사용 중인 팀 슬러그입니다.');
        }

        return this.teamRepo.save({
            name: input.name,
            slug: input.slug,
            description: input.description ?? null,
            iconUrl: null,
            members: [{ userId: input.ownerId, role: 'owner', joinedAt: new Date(), canManageInvites: true }],
        });
    }
}
