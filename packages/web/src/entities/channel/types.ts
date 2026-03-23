export type ChannelType = 'public' | 'private' | 'dm' | 'group';

export interface Channel {
    id: string;
    teamId: string;
    name: string;
    description?: string | null;
    type: ChannelType;
    memberIds?: string[];
    memberCount?: number;
    createdAt: string;
}
