import { Inject, Injectable } from '@nestjs/common';
import type { IMessageRepository } from "../../domain/message.port";
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import { MessageEntity } from '../../domain/message.entity';

export interface GetMessagesInput {
    channelId: string;
    limit?: number;
    before?: Date;
}

/** 채널 메시지 조회 유스케이스 (페이지네이션) */
@Injectable()
export class GetMessagesUseCase {
    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(input: GetMessagesInput): Promise<MessageEntity[]> {
        const limit = Math.min(input.limit ?? 50, 100);
        return this.messageRepo.findByChannel(input.channelId, limit, input.before);
    }
}
