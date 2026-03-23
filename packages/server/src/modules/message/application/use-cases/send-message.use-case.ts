import { Inject, Injectable } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { Attachment, MessageEntity, MessageType } from '../../domain/message.entity';

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
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(input: SendMessageInput): Promise<MessageEntity> {
        const content = input.content?.trim() ?? '';
        const attachments = input.attachments ?? [];
        const type = attachments.length > 0 ? 'file' : input.type ?? 'text';

        /** @mention 파싱: content에서 @userId 형태의 멘션 추출 */
        const mentionPattern = /@([a-f0-9]{24})/g;
        const mentions: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = mentionPattern.exec(content)) !== null) {
            mentions.push(match[1]);
        }

        return this.messageRepo.save({
            teamId: input.teamId,
            channelId: input.channelId,
            authorId: input.authorId,
            authorName: input.authorName,
            content: content || attachments.map((attachment) => attachment.name).join(', '),
            type,
            attachments,
            replyToId: input.replyToId ?? null,
            mentions,
        });
    }
}
