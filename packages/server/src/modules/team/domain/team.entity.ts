export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'guest';
export type TeamInviteRole = Exclude<TeamMemberRole, 'owner'>;

export interface TeamMember {
    userId: string;
    role: TeamMemberRole;
    joinedAt: Date;
    canManageInvites: boolean;
}

export interface TeamInviteLink {
    code: string;
    label: string | null;
    createdBy: string;
    defaultRole: TeamInviteRole;
    expiresAt: Date | null;
    maxUses: number | null;
    useCount: number;
    revokedAt: Date | null;
    createdAt: Date;
}

export function hasAdminRole(role: TeamMemberRole) {
    return role === 'owner' || role === 'admin';
}

export function hasWriteRole(role: TeamMemberRole) {
    return role !== 'guest';
}

/** GitHub Webhook 연동 설정 */
export interface GitHubConfig {
    repoUrl: string;
    webhookSecret: string;
    notifyChannelId: string;
}

export interface BridgeWorkerTargetConfig {
    enabled: boolean;
    webhookUrl: string;
    relayAnnouncements: boolean;
    relayGithub: boolean;
}

export interface BridgeWorkerConfig {
    slack: BridgeWorkerTargetConfig;
    discord: BridgeWorkerTargetConfig;
}

export function createDefaultBridgeWorkerTargetConfig(): BridgeWorkerTargetConfig {
    return {
        enabled: false,
        webhookUrl: '',
        relayAnnouncements: false,
        relayGithub: false,
    };
}

export function createDefaultBridgeWorkerConfig(): BridgeWorkerConfig {
    return {
        slack: createDefaultBridgeWorkerTargetConfig(),
        discord: createDefaultBridgeWorkerTargetConfig(),
    };
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
        public readonly inviteLinks: TeamInviteLink[],
        public readonly githubConfig: GitHubConfig | null,
        public readonly bridgeConfig: BridgeWorkerConfig,
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

    isAdmin(userId: string): boolean {
        return this.members.some((m) => m.userId === userId && m.role === 'admin');
    }

    hasAdminAccess(userId: string): boolean {
        return this.isOwner(userId) || this.isAdmin(userId);
    }

    hasWriteAccess(userId: string): boolean {
        const member = this.getMember(userId);
        return !!member && hasWriteRole(member.role);
    }

    canManageInvites(userId: string): boolean {
        const member = this.getMember(userId);
        return !!member && member.role !== 'guest' && (this.hasAdminAccess(userId) || member.canManageInvites);
    }

    getInvite(code: string): TeamInviteLink | undefined {
        return this.inviteLinks.find((invite) => invite.code === code);
    }

    isInviteActive(code: string, now = new Date()): boolean {
        const invite = this.getInvite(code);
        if (!invite || invite.revokedAt) return false;
        if (invite.expiresAt && invite.expiresAt.getTime() < now.getTime()) return false;
        if (invite.maxUses !== null && invite.useCount >= invite.maxUses) return false;
        return true;
    }

    toPublic() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            description: this.description,
            iconUrl: this.iconUrl,
            memberCount: this.members.length,
            activeInviteCount: this.inviteLinks.filter((invite) => this.isInviteActive(invite.code)).length,
            githubConfig: this.githubConfig,
            bridgeConfig: this.bridgeConfig,
            createdAt: this.createdAt,
        };
    }
}
