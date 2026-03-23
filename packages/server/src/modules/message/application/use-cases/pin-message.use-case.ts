import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import type { IMessageRepository } from '../../domain/message.port';

@Injectable()
export class PinMessageUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(messageId: string, isPinned: boolean) {
        const message = await this.messageRepo.setPinned(messageId, isPinned);
        if (!message) {
            throw new BadRequestException('존재하지 않는 메시지입니다.');
        }
        return message;
    }
}
