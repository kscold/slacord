import { Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';

export interface GitHubRepoConfig {
    teamId: string;
    channelId: string;
    repoFullName: string;
    webhookSecret: string;
}

@Injectable()
export class GithubConfigService {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async findByRepo(repoFullName: string): Promise<GitHubRepoConfig | null> {
        const team = await this.teamRepo.findByGithubRepo(repoFullName);
        if (!team?.githubConfig) return null;
        return {
            teamId: team.id,
            channelId: team.githubConfig.notifyChannelId,
            repoFullName,
            webhookSecret: team.githubConfig.webhookSecret,
        };
    }
}
