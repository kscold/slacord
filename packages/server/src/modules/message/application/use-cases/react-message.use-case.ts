import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { MessageEntity } from '../../domain/message.entity';

/** 메시지 이모지 반응 토글 유스케이스 */
@Injectable()
export class ReactMessageUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(messageId: string, emoji: string, userId: string): Promise<MessageEntity> {
        const updated = await this.messageRepo.toggleReaction(messageId, emoji, userId);
        if (!updated) throw new BadRequestException('존재하지 않는 메시지입니다.');
        return updated;
    }
}
