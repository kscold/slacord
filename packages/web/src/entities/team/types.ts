export interface BridgeTargetConfig {
    enabled: boolean;
    webhookUrl: string;
    relayAnnouncements: boolean;
    relayGithub: boolean;
}

export interface BridgeConfig {
    slack: BridgeTargetConfig;
    discord: BridgeTargetConfig;
}

export interface BridgeJobSummary {
    id: string;
    teamId: string;
    platform: 'slack' | 'discord';
    eventType: 'announcement' | 'github';
    title: string;
    content: string;
    url: string | null;
    status: 'pending' | 'processing' | 'sent' | 'failed';
    attemptCount: number;
    availableAt: string;
    claimedAt: string | null;
    deliveredAt: string | null;
    lastError: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TeamSummary {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    memberCount: number;
    activeInviteCount: number;
    githubConfig: {
        repoUrl: string;
        webhookSecret: string;
        notifyChannelId: string;
    } | null;
    bridgeConfig: BridgeConfig;
    createdAt: string;
}

export interface TeamMemberSummary {
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    joinedAt: string;
    canManageInvites: boolean;
    user: {
        id: string;
        email: string;
        username: string;
        avatarUrl: string | null;
        createdAt: string;
    } | null;
}

export interface TeamInviteLink {
    code: string;
    label: string | null;
    createdBy: string;
    defaultRole: 'admin' | 'member' | 'guest';
    expiresAt: string | null;
    maxUses: number | null;
    useCount: number;
    revokedAt: string | null;
    createdAt: string;
    active: boolean;
}

export interface DiscordImportSummary {
    guildName: string;
    importedChannels: number;
    importedMessages: number;
    updatedMessages: number;
}

export interface TeamInvitePreview {
    code: string;
    teamId: string;
    teamName: string;
    teamSlug: string;
    defaultRole: 'admin' | 'member' | 'guest';
    expiresAt: string | null;
    maxUses: number | null;
    useCount: number;
    active: boolean;
}
