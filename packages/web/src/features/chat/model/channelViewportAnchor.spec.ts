import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readChannelViewportAnchor, writeChannelViewportAnchor } from './channelViewportAnchor';

describe('channelViewportAnchor', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('sessionStorage에 저장한 anchor를 다시 읽는다', () => {
        const store = new Map<string, string>();
        vi.stubGlobal('window', {
            sessionStorage: {
                getItem: (key: string) => store.get(key) ?? null,
                removeItem: (key: string) => {
                    store.delete(key);
                },
                setItem: (key: string, value: string) => {
                    store.set(key, value);
                },
            },
        });

        writeChannelViewportAnchor('team-1', 'channel-1', {
            messageId: 'message-1',
            createdAt: '2026-04-16T02:20:00.000Z',
        });

        expect(readChannelViewportAnchor('team-1', 'channel-1')).toEqual({
            messageId: 'message-1',
            createdAt: '2026-04-16T02:20:00.000Z',
        });
    });

    it('anchor를 null로 저장하면 sessionStorage에서 제거한다', () => {
        const store = new Map<string, string>();
        vi.stubGlobal('window', {
            sessionStorage: {
                getItem: (key: string) => store.get(key) ?? null,
                removeItem: (key: string) => {
                    store.delete(key);
                },
                setItem: (key: string, value: string) => {
                    store.set(key, value);
                },
            },
        });

        writeChannelViewportAnchor('team-1', 'channel-1', {
            messageId: 'message-1',
            createdAt: '2026-04-16T02:20:00.000Z',
        });
        writeChannelViewportAnchor('team-1', 'channel-1', null);

        expect(readChannelViewportAnchor('team-1', 'channel-1')).toBeNull();
    });
});
