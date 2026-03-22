import { Inject, Injectable } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { MessageEntity } from '../../domain/message.entity';

export interface SendMessageInput {
    teamId: string;
    channelId: string;
    authorId: string;
    content: string;
    replyToId?: string;
}

/** 메시지 전송 유스케이스 */
@Injectable()
export class SendMessageUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(input: SendMessageInput): Promise<MessageEntity> {
        return this.messageRepo.save({
            teamId: input.teamId,
            channelId: input.channelId,
            authorId: input.authorId,
            content: input.content,
            type: 'text',
            attachments: [],
            replyToId: input.replyToId ?? null,
        });
    }
}
