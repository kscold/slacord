import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';

/** 메시지 삭제 유스케이스 - 작성자 본인만 가능 */
@Injectable()
export class DeleteMessageUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepo.findById(messageId);
        if (!message) throw new BadRequestException('존재하지 않는 메시지입니다.');
        if (message.authorId !== userId) throw new BadRequestException('메시지 작성자만 삭제할 수 있습니다.');

        await this.messageRepo.deleteById(messageId);
    }
}
