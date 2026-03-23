export type MessageType = 'text' | 'system' | 'file';

export interface Reaction {
    emoji: string;
    userIds: string[];
}

export interface Attachment {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

export interface Message {
    id: string;
    channelId: string;
    teamId?: string;
    authorId: string;
    authorName?: string | null;
    content: string;
    type: MessageType;
    attachments: Attachment[];
    replyToId: string | null;
    reactions: Reaction[];
    mentions: string[];
    isEdited: boolean;
    isPinned: boolean;
    pinnedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** GitHub 이벤트 메타데이터 (system 메시지 content에서 파싱) */
export interface GitHubEventMeta {
    eventType: string;
    repo: string;
    prNumber: number | null;
    prTitle: string;
    prUrl: string;
    actor: string;
}
