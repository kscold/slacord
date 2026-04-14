import { ChannelReadEntity } from './channel-read.entity';

export interface IChannelReadRepository {
    findByChannelIdsForUser(channelIds: string[], userId: string): Promise<ChannelReadEntity[]>;
    markRead(data: { teamId: string; channelId: string; userId: string; lastReadAt: Date }): Promise<ChannelReadEntity>;
}

export const CHANNEL_READ_REPOSITORY = Symbol('IChannelReadRepository');
