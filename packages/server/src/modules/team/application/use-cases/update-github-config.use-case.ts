import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { ITeamRepository } from '../../domain/team.port';
import { TEAM_REPOSITORY } from '../../domain/team.port';
import { createTeamAuditLogEntry, type TeamEntity, type GitHubConfig } from '../../domain/team.entity';
import { normalizeGitHubRepo } from '../../../../shared/lib/normalize-github-repo';

@Injectable()
export class UpdateGithubConfigUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, actorId: string, config: GitHubConfig): Promise<TeamEntity> {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(actorId)) throw new BadRequestException('GitHub 설정을 변경할 권한이 없습니다.');

        const normalizedRepo = normalizeGitHubRepo(config.repoUrl);
        if (!normalizedRepo) throw new BadRequestException('GitHub 저장소 주소 형식이 올바르지 않습니다.');
        const normalizedConfig = {
            ...config,
            repoUrl: `https://github.com/${normalizedRepo}`,
        };
        const result = await this.teamRepo.updateGithubConfig(
            teamId,
            normalizedConfig,
            createTeamAuditLogEntry({
                actorId,
                category: 'delivery',
                action: 'github_config_updated',
                summary: 'GitHub webhook 설정을 저장함',
                target: normalizedConfig.repoUrl,
                metadata: {
                    hasWebhookSecret: Boolean(normalizedConfig.webhookSecret.trim()),
                    notifyChannelId: normalizedConfig.notifyChannelId,
                },
            }),
        );
        if (!result) throw new BadRequestException('GitHub 설정 저장에 실패했습니다.');
        return result;
    }
}
