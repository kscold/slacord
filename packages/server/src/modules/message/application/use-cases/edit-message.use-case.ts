import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { MessageEntity } from '../../domain/message.entity';

/** 메시지 편집 유스케이스 - 작성자 본인만 가능 */
@Injectable()
export class EditMessageUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(messageId: string, userId: string, content: string): Promise<MessageEntity> {
        const message = await this.messageRepo.findById(messageId);
        if (!message) throw new BadRequestException('존재하지 않는 메시지입니다.');
        if (message.authorId !== userId) throw new BadRequestException('메시지 작성자만 편집할 수 있습니다.');
        if (message.type === 'system') throw new BadRequestException('시스템 메시지는 편집할 수 없습니다.');

        const updated = await this.messageRepo.updateContent(messageId, content);
        if (!updated) throw new BadRequestException('메시지 편집에 실패했습니다.');
        return updated;
    }
}
