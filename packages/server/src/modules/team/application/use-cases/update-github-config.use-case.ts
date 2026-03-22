import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { ITeamRepository } from '../../domain/team.port';
import { TEAM_REPOSITORY } from '../../domain/team.port';
import type { TeamEntity, GitHubConfig } from '../../domain/team.entity';

@Injectable()
export class UpdateGithubConfigUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, config: GitHubConfig): Promise<TeamEntity> {
        const result = await this.teamRepo.updateGithubConfig(teamId, config);
        if (!result) throw new BadRequestException('존재하지 않는 팀입니다.');
        return result;
    }
}
