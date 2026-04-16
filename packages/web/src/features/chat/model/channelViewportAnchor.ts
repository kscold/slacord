'use client';

interface ChannelViewportAnchor {
    createdAt: string;
    messageId: string;
}

const STORAGE_PREFIX = 'slacord:channel-viewport-anchor';

function getStorageKey(teamId: string, channelId: string) {
    return `${STORAGE_PREFIX}:${teamId}:${channelId}`;
}

export function readChannelViewportAnchor(teamId: string, channelId: string): ChannelViewportAnchor | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.sessionStorage.getItem(getStorageKey(teamId, channelId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<ChannelViewportAnchor>;
        if (!parsed.messageId || !parsed.createdAt) return null;
        return { messageId: parsed.messageId, createdAt: parsed.createdAt };
    } catch {
        return null;
    }
}

export function writeChannelViewportAnchor(teamId: string, channelId: string, anchor: ChannelViewportAnchor | null) {
    if (typeof window === 'undefined') return;

    const storageKey = getStorageKey(teamId, channelId);
    if (!anchor) {
        window.sessionStorage.removeItem(storageKey);
        return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(anchor));
}
