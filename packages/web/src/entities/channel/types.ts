export type ChannelType = 'text' | 'announcement';

export interface Channel {
    id: string;
    teamId: string;
    name: string;
    type: ChannelType;
    createdAt: string;
}
