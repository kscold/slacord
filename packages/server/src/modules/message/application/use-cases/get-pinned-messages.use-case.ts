import { Inject, Injectable } from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import type { IMessageRepository } from '../../domain/message.port';

@Injectable()
export class GetPinnedMessagesUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    execute(channelId: string) {
        return this.messageRepo.findPinnedByChannel(channelId);
    }
}
