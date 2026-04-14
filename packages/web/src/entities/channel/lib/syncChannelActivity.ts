import type { Channel } from '../types';
import type { Message } from '@/src/entities/message/types';

interface ApplyUnreadMessageInput {
    message: Message;
    currentUserId: string;
    activeChannelId: string | null;
    isVisible: boolean;
}

interface ChannelReadDetail {
    channelId: string;
    lastReadAt: string;
}

export function applyUnreadMessage(channels: Channel[], input: ApplyUnreadMessageInput) {
    return channels.map((channel) => {
        if (channel.id !== input.message.channelId) return channel;

        const lastMessageAt = input.message.createdAt;
        const lastReadAt = input.message.createdAt;
        const isOwnMessage = input.message.authorId === input.currentUserId;
        const isActiveVisibleChannel = channel.id === input.activeChannelId && input.isVisible;

        if (isOwnMessage || isActiveVisibleChannel) {
            return {
                ...channel,
                lastMessageAt,
                lastReadAt,
                unreadCount: 0,
                mentionCount: 0,
            };
        }

        return {
            ...channel,
            lastMessageAt,
            unreadCount: (channel.unreadCount ?? 0) + 1,
            mentionCount: (channel.mentionCount ?? 0) + (input.message.mentions.includes(input.currentUserId) ? 1 : 0),
        };
    });
}

export function applyChannelRead(channels: Channel[], detail: ChannelReadDetail) {
    return channels.map((channel) => {
        if (channel.id !== detail.channelId) return channel;
        return {
            ...channel,
            lastReadAt: detail.lastReadAt,
            unreadCount: 0,
            mentionCount: 0,
        };
    });
}
