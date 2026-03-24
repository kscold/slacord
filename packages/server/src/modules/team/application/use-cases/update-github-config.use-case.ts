import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { ITeamRepository } from '../../domain/team.port';
import { TEAM_REPOSITORY } from '../../domain/team.port';
import type { TeamEntity, GitHubConfig } from '../../domain/team.entity';
import { normalizeGitHubRepo } from '../../../../shared/lib/normalize-github-repo';

@Injectable()
export class UpdateGithubConfigUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, config: GitHubConfig): Promise<TeamEntity> {
        const normalizedRepo = normalizeGitHubRepo(config.repoUrl);
        if (!normalizedRepo) throw new BadRequestException('GitHub 저장소 주소 형식이 올바르지 않습니다.');
        const result = await this.teamRepo.updateGithubConfig(teamId, {
            ...config,
            repoUrl: `https://github.com/${normalizedRepo}`,
        });
        if (!result) throw new BadRequestException('존재하지 않는 팀입니다.');
        return result;
    }
}
