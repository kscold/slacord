import { MarkAllNotificationsAsReadUseCase } from './mark-all-notifications-as-read.use-case';

describe('MarkAllNotificationsAsReadUseCase', () => {
    const mockRepo = {
        findByRecipient: jest.fn(),
        countUnread: jest.fn(),
        save: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
    };

    const mockGateway = {
        emitNotification: jest.fn(),
        emitNotificationRead: jest.fn(),
        emitNotificationsReadAll: jest.fn(),
    };

    let useCase: MarkAllNotificationsAsReadUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new MarkAllNotificationsAsReadUseCase(mockRepo as any, mockGateway as any);
    });

    it('읽음 처리된 알림이 있으면 read_all 이벤트를 전파함', async () => {
        mockRepo.markAllAsRead.mockResolvedValue(3);

        const result = await useCase.execute('team-1', 'user-2');

        expect(result).toBe(3);
        expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('team-1', 'user-2');
        expect(mockGateway.emitNotificationsReadAll).toHaveBeenCalledWith('team-1', 'user-2');
    });

    it('읽음 처리된 알림이 없으면 이벤트를 보내지 않음', async () => {
        mockRepo.markAllAsRead.mockResolvedValue(0);

        const result = await useCase.execute('team-1', 'user-2');

        expect(result).toBe(0);
        expect(mockGateway.emitNotificationsReadAll).not.toHaveBeenCalled();
    });
});
