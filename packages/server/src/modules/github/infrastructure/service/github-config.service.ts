import { Injectable } from '@nestjs/common';

export interface GitHubRepoConfig {
    teamId: string;
    channelId: string;
    repoFullName: string;
    webhookSecret: string;
}

/**
 * GitHub Webhook 설정 관리 서비스
 * - 팀 설정 API로 등록된 레포 설정을 인메모리로 캐시
 * - 실제 운영에서는 team.schema의 githubConfig와 동기화
 */
@Injectable()
export class GithubConfigService {
    private readonly configs = new Map<string, GitHubRepoConfig>();

    register(config: GitHubRepoConfig): void {
        this.configs.set(config.repoFullName, config);
    }

    findByRepo(repoFullName: string): GitHubRepoConfig | null {
        return this.configs.get(repoFullName) ?? null;
    }

    unregister(repoFullName: string): void {
        this.configs.delete(repoFullName);
    }
}
