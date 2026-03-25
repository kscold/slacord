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
    createdAt: string;
}

export interface TeamMemberSummary {
    userId: string;
    role: 'owner' | 'admin' | 'member';
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
    defaultRole: 'admin' | 'member';
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
    defaultRole: 'admin' | 'member';
    expiresAt: string | null;
    maxUses: number | null;
    useCount: number;
    active: boolean;
}
