import { Inject, Injectable } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { Attachment, MessageEntity, MessageType } from '../../domain/message.entity';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import { USER_REPOSITORY, type IUserRepository } from '../../../auth/domain/auth.port';

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

/** 메시지 전송 유스케이스 */
@Injectable()
export class SendMessageUseCase {
    constructor(
        @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
        private readonly createNotification: CreateNotificationUseCase,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    ) {}

    async execute(input: SendMessageInput): Promise<MessageEntity> {
        const content = input.content?.trim() ?? '';
        const attachments = input.attachments ?? [];
        const type = attachments.length > 0 ? 'file' : (input.type ?? 'text');
        const mentionUserIds = await this.resolveMentionUserIds(input.teamId, input.authorId, content);

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
            void this.createNotification.executeBulk(
                mentionUserIds.map((recipientId) => ({
                    teamId: input.teamId,
                    recipientId,
                    type: 'mention',
                    actorId: input.authorId,
                    actorName: input.authorName ?? '알 수 없음',
                    content: content.slice(0, 160) || '새 멘션',
                    resourceType: 'message',
                    resourceId: message.id,
                    channelId: input.channelId,
                })),
            );
        }

        // 스레드 답글 알림 — 원본 메시지 작성자에게
        if (input.replyToId) {
            const parent = await this.messageRepo.findById(input.replyToId);
            if (parent && parent.authorId !== input.authorId) {
                void this.createNotification.execute({
                    teamId: input.teamId,
                    recipientId: parent.authorId,
                    type: 'thread_reply',
                    actorId: input.authorId,
                    actorName: input.authorName ?? '알 수 없음',
                    content: content.slice(0, 100) || '새 답글',
                    resourceType: 'message',
                    resourceId: message.id,
                    channelId: input.channelId,
                });
            }
        }

        return message;
    }

    private async resolveMentionUserIds(teamId: string, authorId: string, content: string) {
        const mentionTokens = this.extractMentionTokens(content);
        if (mentionTokens.length === 0) return [];

        const team = await this.teamRepo.findById(teamId);
        if (!team) return [];

        const users = await this.userRepo.findByIds(team.members.map((member) => member.userId));
        const userIdByUsername = new Map(users.map((user) => [user.username.toLowerCase(), user.id]));

        return [
            ...new Set(
                mentionTokens
                    .map((token) => userIdByUsername.get(token))
                    .filter((userId): userId is string => Boolean(userId) && userId !== authorId),
            ),
        ];
    }

    private extractMentionTokens(content: string) {
        const mentionPattern = /@([^\s@]+)/g;
        const mentionTokens: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = mentionPattern.exec(content)) !== null) {
            mentionTokens.push(match[1].replace(/[.,!?;:]+$/g, '').toLowerCase());
        }
        return mentionTokens;
    }
}
