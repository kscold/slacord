import { MessageEntity, MessageType, Attachment } from './message.entity';

export interface IMessageRepository {
    findByChannel(channelId: string, limit: number, before?: Date): Promise<MessageEntity[]>;
    save(data: {
        teamId: string;
        channelId: string;
        authorId: string;
        content: string;
        type: MessageType;
        attachments: Attachment[];
        replyToId: string | null;
    }): Promise<MessageEntity>;
}

export const MESSAGE_REPOSITORY = Symbol('IMessageRepository');
