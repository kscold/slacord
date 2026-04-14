'use client';

export const workspaceChannelReadEvent = 'slacord:channel-read';

export interface WorkspaceChannelReadDetail {
    channelId: string;
    lastReadAt: string;
}

export function emitWorkspaceChannelRead(detail: WorkspaceChannelReadDetail) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(workspaceChannelReadEvent, { detail }));
}
