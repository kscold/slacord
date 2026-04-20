import { NotificationController } from './notification.controller';
import { NotificationEntity } from '../../domain/notification.entity';

function makeNotification(id: string) {
    return new NotificationEntity(
        id,
        'team-1',
        'user-2',
        'thread_reply',
        'user-1',
        '김슬랙',
        '답글이 달렸어요.',
        'message',
        'message-1',
        'channel-1',
        false,
        new Date('2026-03-31T00:00:00.000Z'),
    );
}

describe('NotificationController', () => {
    const mockGetNotificationsUseCase = {
        execute: jest.fn(),
    };

    const mockGetUnreadCountUseCase = {
        execute: jest.fn(),
    };

    const mockMarkAsReadUseCase = {
        execute: jest.fn(),
    };

    const mockMarkAllAsReadUseCase = {
        execute: jest.fn(),
    };

    let controller: NotificationController;

    beforeEach(() => {
        jest.clearAllMocks();
        // 권한 검사는 TeamAccessGuard(AOP)가 담당하므로 컨트롤러에서 주입받지 않음
        controller = new NotificationController(
            mockGetNotificationsUseCase as any,
            mockGetUnreadCountUseCase as any,
            mockMarkAsReadUseCase as any,
            mockMarkAllAsReadUseCase as any,
        );
    });

    it('알림 목록 조회 시 공개 응답을 반환함', async () => {
        const notification = makeNotification('notification-1');
        mockGetNotificationsUseCase.execute.mockResolvedValue([notification]);

        const result = await controller.getNotifications('team-1', { userId: 'user-2' });

        expect(mockGetNotificationsUseCase.execute).toHaveBeenCalledWith('team-1', 'user-2');
        expect(result).toEqual({ success: true, data: [notification.toPublic()] });
    });

    it('읽지 않은 알림 수를 반환함', async () => {
        mockGetUnreadCountUseCase.execute.mockResolvedValue(5);

        const result = await controller.getUnreadCount('team-1', { userId: 'user-2' });

        expect(result).toEqual({ success: true, data: { count: 5 } });
    });

    it('단일 읽음 처리 요청을 위임함', async () => {
        const result = await controller.markAsRead('notification-1', { userId: 'user-2' });

        expect(mockMarkAsReadUseCase.execute).toHaveBeenCalledWith('notification-1', 'user-2');
        expect(result).toEqual({ success: true });
    });

    it('전체 읽음 처리 요청을 위임함', async () => {
        const result = await controller.markAllAsRead('team-1', { userId: 'user-2' });

        expect(mockMarkAllAsReadUseCase.execute).toHaveBeenCalledWith('team-1', 'user-2');
        expect(result).toEqual({ success: true });
    });
});
