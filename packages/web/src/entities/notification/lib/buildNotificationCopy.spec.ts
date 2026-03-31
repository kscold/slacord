import { buildNotificationCopy } from './buildNotificationCopy';
import type { AppNotification } from '../types';

function makeNotification(type: AppNotification['type'], overrides: Partial<AppNotification> = {}): AppNotification {
    return {
        id: 'notification-1',
        teamId: 'team-1',
        recipientId: 'user-2',
        type,
        actorId: 'user-1',
        actorName: '김슬랙',
        content: '새 소식이 도착했어요.',
        resourceType: 'issue',
        resourceId: 'issue-1',
        channelId: 'channel-1',
        isRead: false,
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

describe('buildNotificationCopy', () => {
    it('멘션 알림 제목을 자연스럽게 만듦', () => {
        const result = buildNotificationCopy(makeNotification('mention'));

        expect(result.title).toBe('김슬랙님이 멘션했어요');
        expect(result.body).toBe('새 소식이 도착했어요.');
    });

    it('내용이 비어 있으면 타입별 기본 문구를 사용함', () => {
        const result = buildNotificationCopy(makeNotification('issue_updated', { content: '   ' }));

        expect(result.typeLabel).toBe('이슈 업데이트');
        expect(result.body).toBe('이슈 업데이트 내용을 확인해 주세요.');
    });

    it('작성자 이름이 없으면 기본 이름을 사용함', () => {
        const result = buildNotificationCopy(makeNotification('thread_reply', { actorName: '' }));

        expect(result.actorName).toBe('팀 동료');
        expect(result.title).toBe('팀 동료님이 스레드에 답글을 남겼어요');
    });
});
