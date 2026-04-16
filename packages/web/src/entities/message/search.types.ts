export interface MessageSearchResult {
    id: string;
    teamId: string;
    teamName: string;
    channelId: string;
    channelName: string;
    authorName: string;
    content: string;
    createdAt: string;
    type: 'file' | 'system' | 'text';
    isPinned: boolean;
    attachmentCount: number;
}

export interface MessageSearchPayload {
    pinnedResults: MessageSearchResult[];
    recentResults: MessageSearchResult[];
    results: MessageSearchResult[];
    teamCount: number;
}
