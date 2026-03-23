export type MessageType = 'text' | 'file' | 'system';

export interface Attachment {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

/** 이모지 반응 (emoji 별 userId 목록) */
export interface Reaction {
    emoji: string;
    userIds: string[];
}

/** 순수 채팅 메시지 도메인 엔티티 (Slack/Discord 의존성 없음) */
export class MessageEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly channelId: string,
        public readonly authorId: string,
        public readonly authorName: string | null,
        public readonly content: string,
        public readonly type: MessageType,
        public readonly attachments: Attachment[],
        public readonly replyToId: string | null,
        public readonly reactions: Reaction[],
        public readonly mentions: string[],
        public readonly isEdited: boolean,
        public readonly isPinned: boolean,
        public readonly pinnedAt: Date | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            channelId: this.channelId,
            authorId: this.authorId,
            authorName: this.authorName,
            content: this.content,
            type: this.type,
            attachments: this.attachments,
            replyToId: this.replyToId,
            reactions: this.reactions,
            mentions: this.mentions,
            isEdited: this.isEdited,
            isPinned: this.isPinned,
            pinnedAt: this.pinnedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
