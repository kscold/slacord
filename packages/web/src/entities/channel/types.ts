export type ChannelType = 'public' | 'private' | 'dm' | 'group' | 'voice';

export interface Channel {
    id: string;
    teamId: string;
    name: string;
    description?: string | null;
    type: ChannelType;
    memberIds?: string[];
    memberCount?: number;
    unreadCount?: number;
    mentionCount?: number;
    lastReadAt?: string | null;
    lastMessageAt?: string | null;
    createdAt: string;
}
