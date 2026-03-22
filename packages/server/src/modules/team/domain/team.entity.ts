export type TeamMemberRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
    userId: string;
    role: TeamMemberRole;
    joinedAt: Date;
}

/** GitHub Webhook 연동 설정 */
export interface GitHubConfig {
    repoUrl: string;
    webhookSecret: string;
    notifyChannelId: string;
}

/** 팀(워크스페이스) 도메인 엔티티 */
export class TeamEntity {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly slug: string,
        public readonly description: string | null,
        public readonly iconUrl: string | null,
        public readonly members: TeamMember[],
        public readonly githubConfig: GitHubConfig | null,
        public readonly createdAt: Date,
    ) {}

    getMember(userId: string): TeamMember | undefined {
        return this.members.find((m) => m.userId === userId);
    }

    isMember(userId: string): boolean {
        return this.members.some((m) => m.userId === userId);
    }

    isOwner(userId: string): boolean {
        return this.members.some((m) => m.userId === userId && m.role === 'owner');
    }

    toPublic() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            description: this.description,
            iconUrl: this.iconUrl,
            memberCount: this.members.length,
            githubConfig: this.githubConfig,
            createdAt: this.createdAt,
        };
    }
}
