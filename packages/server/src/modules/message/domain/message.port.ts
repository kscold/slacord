import { MessageEntity, MessageType, Attachment } from './message.entity';

export interface IMessageRepository {
    findByChannel(channelId: string, limit: number, before?: Date): Promise<MessageEntity[]>;
    findById(id: string): Promise<MessageEntity | null>;
    save(data: {
        teamId: string;
        channelId: string;
        authorId: string;
        content: string;
        type: MessageType;
        attachments: Attachment[];
        replyToId: string | null;
        mentions: string[];
    }): Promise<MessageEntity>;
    updateContent(id: string, content: string): Promise<MessageEntity | null>;
    deleteById(id: string): Promise<boolean>;
    /** emoji 반응 토글: 이미 추가한 경우 제거, 없으면 추가 */
    toggleReaction(id: string, emoji: string, userId: string): Promise<MessageEntity | null>;
}

export const MESSAGE_REPOSITORY = Symbol('IMessageRepository');
