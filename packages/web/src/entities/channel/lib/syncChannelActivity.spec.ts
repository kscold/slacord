import { describe, expect, it } from 'vitest';
import { applyChannelRead, applyUnreadMessage } from './syncChannelActivity';
import type { Channel } from '../types';
import type { Message } from '@/src/entities/message/types';

function makeChannel(overrides: Partial<Channel> = {}): Channel {
    return {
        id: 'channel-1',
        teamId: 'team-1',
        name: 'general',
        type: 'public',
        createdAt: '2026-04-14T00:00:00.000Z',
        unreadCount: 0,
        mentionCount: 0,
        lastReadAt: '2026-04-14T00:00:00.000Z',
        lastMessageAt: null,
        ...overrides,
    };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: 'message-1',
        teamId: 'team-1',
        channelId: 'channel-1',
        authorId: 'user-2',
        authorName: 'actor',
        content: 'hello',
        type: 'text',
        attachments: [],
        replyToId: null,
        reactions: [],
        mentions: [],
        isEdited: false,
        isPinned: false,
        pinnedAt: null,
        createdAt: '2026-04-14T01:00:00.000Z',
        updatedAt: '2026-04-14T01:00:00.000Z',
        ...overrides,
    };
}

describe('syncChannelActivity', () => {
    it('다른 채널의 새 메시지에 unread와 mention 배지를 올린다', () => {
        const channels = [makeChannel()];
        const next = applyUnreadMessage(channels, {
            message: makeMessage({ mentions: ['user-1'] }),
            currentUserId: 'user-1',
            activeChannelId: null,
            isVisible: true,
        });

        expect(next[0]).toMatchObject({
            unreadCount: 1,
            mentionCount: 1,
            lastMessageAt: '2026-04-14T01:00:00.000Z',
        });
    });

    it('활성 채널이 보이는 상태면 unread를 즉시 비운다', () => {
        const channels = [makeChannel({ unreadCount: 3, mentionCount: 1 })];
        const next = applyUnreadMessage(channels, {
            message: makeMessage({ mentions: ['user-1'] }),
            currentUserId: 'user-1',
            activeChannelId: 'channel-1',
            isVisible: true,
        });

        expect(next[0]).toMatchObject({
            unreadCount: 0,
            mentionCount: 0,
            lastReadAt: '2026-04-14T01:00:00.000Z',
        });
    });

    it('읽음 이벤트를 받으면 배지를 지운다', () => {
        const channels = [makeChannel({ unreadCount: 2, mentionCount: 1 })];
        const next = applyChannelRead(channels, {
            channelId: 'channel-1',
            lastReadAt: '2026-04-14T02:00:00.000Z',
        });

        expect(next[0]).toMatchObject({
            unreadCount: 0,
            mentionCount: 0,
            lastReadAt: '2026-04-14T02:00:00.000Z',
        });
    });
});
