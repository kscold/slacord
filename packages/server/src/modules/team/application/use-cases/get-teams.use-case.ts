import { Inject, Injectable } from '@nestjs/common';
import type { ITeamRepository } from "../../domain/team.port";
import { TEAM_REPOSITORY } from '../../domain/team.port';
import { TeamEntity } from '../../domain/team.entity';

/** 내가 속한 팀 목록 조회 유스케이스 */
@Injectable()
export class GetTeamsUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(userId: string): Promise<TeamEntity[]> {
        return this.teamRepo.findByMember(userId);
    }
}
