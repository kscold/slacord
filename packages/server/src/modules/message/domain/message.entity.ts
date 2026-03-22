export type MessageType = 'text' | 'file' | 'system';

export interface Attachment {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

/** 순수 채팅 메시지 도메인 엔티티 (Slack/Discord 의존성 없음) */
export class MessageEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly channelId: string,
        public readonly authorId: string,
        public readonly content: string,
        public readonly type: MessageType,
        public readonly attachments: Attachment[],
        public readonly replyToId: string | null,
        public readonly createdAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            channelId: this.channelId,
            authorId: this.authorId,
            content: this.content,
            type: this.type,
            attachments: this.attachments,
            replyToId: this.replyToId,
            createdAt: this.createdAt,
        };
    }
}
