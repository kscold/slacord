export interface TeamSummary {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    memberCount: number;
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
    user: {
        id: string;
        email: string;
        username: string;
        avatarUrl: string | null;
        createdAt: string;
    } | null;
}
