import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CHANNEL_REPOSITORY, type IChannelRepository } from '../../../channel/domain/channel.port';
import { MESSAGE_REPOSITORY, type IMessageRepository } from '../../domain/message.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';

@Injectable()
export class MessageAccessService {
    constructor(
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
        @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    async ensureChannelMember(channelId: string, userId: string) {
        const channel = await this.channelRepo.findById(channelId);
        if (!channel) {
            throw new BadRequestException('존재하지 않는 채널입니다.');
        }

        const team = await this.teamRepo.findById(channel.teamId);
        if (!team) {
            throw new ForbiddenException('워크스페이스를 찾을 수 없습니다.');
        }
        if (!team.isMember(userId)) {
            throw new ForbiddenException('이 워크스페이스의 멤버가 아닙니다.');
        }

        if (channel.type !== 'public' && channel.type !== 'voice' && !channel.isMember(userId)) {
            throw new ForbiddenException('이 채널에 접근할 권한이 없습니다.');
        }

        return { channel, team };
    }

    async ensureMessageInChannel(channelId: string, messageId: string, userId: string) {
        const access = await this.ensureChannelMember(channelId, userId);
        const message = await this.messageRepo.findById(messageId);
        if (!message || message.channelId !== access.channel.id) {
            throw new BadRequestException('존재하지 않는 메시지입니다.');
        }
        return { ...access, message };
    }
}
