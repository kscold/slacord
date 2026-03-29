import { Inject, Injectable } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { Attachment, MessageEntity, MessageType } from '../../domain/message.entity';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

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
    ) {}

    async execute(input: SendMessageInput): Promise<MessageEntity> {
        const content = input.content?.trim() ?? '';
        const attachments = input.attachments ?? [];
        const type = attachments.length > 0 ? 'file' : input.type ?? 'text';

        /** @mention 파싱: content에서 @username 형태의 멘션 추출 */
        const mentionPattern = /@(\S+)/g;
        const mentionNames: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = mentionPattern.exec(content)) !== null) {
            mentionNames.push(match[1]);
        }

        const message = await this.messageRepo.save({
            teamId: input.teamId,
            channelId: input.channelId,
            authorId: input.authorId,
            authorName: input.authorName,
            content: content || attachments.map((attachment) => attachment.name).join(', '),
            type,
            attachments,
            replyToId: input.replyToId ?? null,
            mentions: mentionNames,
        });

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
}
