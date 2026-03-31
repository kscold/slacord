import { applyNotificationRead, applyNotificationReadAll, prependNotification } from './syncNotifications';
import type { AppNotification } from '../types';

function makeNotification(id: string, isRead = false): AppNotification {
    return {
        id,
        teamId: 'team-1',
        recipientId: 'user-1',
        type: 'mention',
        actorId: 'user-2',
        actorName: '김슬랙',
        content: '알림',
        resourceType: 'message',
        resourceId: 'message-1',
        channelId: 'channel-1',
        isRead,
        createdAt: new Date().toISOString(),
    };
}

describe('syncNotifications', () => {
    it('새 알림을 맨 앞에 두고 같은 ID는 중복 제거함', () => {
        const result = prependNotification(
            [makeNotification('old'), makeNotification('dup')],
            makeNotification('dup'),
        );

        expect(result.map((item) => item.id)).toEqual(['dup', 'old']);
    });

    it('단일 읽음 처리 시 해당 알림만 읽음으로 바꿈', () => {
        const result = applyNotificationRead([makeNotification('a'), makeNotification('b')], 'b');

        expect(result.find((item) => item.id === 'a')?.isRead).toBe(false);
        expect(result.find((item) => item.id === 'b')?.isRead).toBe(true);
    });

    it('전체 읽음 처리 시 모든 알림을 읽음으로 바꿈', () => {
        const result = applyNotificationReadAll([makeNotification('a'), makeNotification('b')]);

        expect(result.every((item) => item.isRead)).toBe(true);
    });
});
