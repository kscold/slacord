import { ChannelEntity, ChannelType } from './channel.entity';

export interface IChannelRepository {
    findById(id: string): Promise<ChannelEntity | null>;
    findByTeam(teamId: string): Promise<ChannelEntity[]>;
    save(data: {
        teamId: string;
        name: string;
        description: string | null;
        type: ChannelType;
        createdBy: string;
        memberIds: string[];
    }): Promise<ChannelEntity>;
    addMember(channelId: string, userId: string): Promise<ChannelEntity>;
    existsByNameInTeam(teamId: string, name: string): Promise<boolean>;
}

export const CHANNEL_REPOSITORY = Symbol('IChannelRepository');
