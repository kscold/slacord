import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { Attachment, MessageEntity, MessageType } from '../../domain/message.entity';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import { USER_REPOSITORY, type IUserRepository } from '../../../auth/domain/auth.port';
import {
    NOTIFICATION_EVENTS,
    type MentionedEvent,
    type ThreadRepliedEvent,
} from '../../../../shared/events/notification-events';
import { extractMentionTokens, resolveMentionUserIds } from '../../../../shared/lib/mention-extraction';

export interface SendMessageInput {
    teamId: string;
    channelId: string;
    authorId: string;
    authorName: string | null;
    content?: string;
    type?: MessageType;
    attachments?: Attachment[];
    replyToId?: string;
}

/**
 * 메시지 전송 유스케이스.
 * 알림은 도메인 이벤트로 발행하고 NotificationEventListener가 처리.
 */
@Injectable()
export class SendMessageUseCase {
    constructor(
        @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async execute(input: SendMessageInput): Promise<MessageEntity> {
        const content = input.content?.trim() ?? '';
        const attachments = input.attachments ?? [];
        const type = attachments.length > 0 ? 'file' : (input.type ?? 'text');
        const mentionUserIds = await this.findMentionedUserIds(input.teamId, input.authorId, content);

        const message = await this.messageRepo.save({
            teamId: input.teamId,
            channelId: input.channelId,
            authorId: input.authorId,
            authorName: input.authorName,
            content: content || attachments.map((attachment) => attachment.name).join(', '),
            type,
            attachments,
            replyToId: input.replyToId ?? null,
            mentions: mentionUserIds,
        });

        if (mentionUserIds.length > 0) {
            const event: MentionedEvent = {
                teamId: input.teamId,
                recipientIds: mentionUserIds,
                actorId: input.authorId,
                actorName: input.authorName ?? '알 수 없음',
                content,
                resourceType: 'message',
                resourceId: message.id,
                channelId: input.channelId,
            };
            this.eventEmitter.emit(NOTIFICATION_EVENTS.MENTIONED, event);
        }

        if (input.replyToId) {
            const parent = await this.messageRepo.findById(input.replyToId);
            if (parent && parent.authorId !== input.authorId) {
                const event: ThreadRepliedEvent = {
                    teamId: input.teamId,
                    recipientId: parent.authorId,
                    actorId: input.authorId,
                    actorName: input.authorName ?? '알 수 없음',
                    content,
                    resourceType: 'message',
                    resourceId: message.id,
                    channelId: input.channelId,
                };
                this.eventEmitter.emit(NOTIFICATION_EVENTS.THREAD_REPLIED, event);
            }
        }

        return message;
    }

    private async findMentionedUserIds(teamId: string, authorId: string, content: string) {
        const tokens = extractMentionTokens(content);
        if (tokens.length === 0) return [];

        const team = await this.teamRepo.findById(teamId);
        if (!team) return [];

        const users = await this.userRepo.findByIds(team.members.map((member) => member.userId));
        return resolveMentionUserIds(
            tokens,
            users.map((u) => ({ userId: u.id, username: u.username })),
            authorId,
        );
    }
}
