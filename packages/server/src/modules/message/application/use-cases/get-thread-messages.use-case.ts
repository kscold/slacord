import { Inject, Injectable } from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import type { IMessageRepository } from '../../domain/message.port';

@Injectable()
export class GetThreadMessagesUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    execute(parentMessageId: string) {
        return this.messageRepo.findThreadReplies(parentMessageId);
    }
}
