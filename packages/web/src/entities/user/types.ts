export type PresenceStatus = 'online' | 'away' | 'offline';

export interface User {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
}

export interface Presence {
    userId: string;
    status: PresenceStatus;
    lastSeen: string;
}
