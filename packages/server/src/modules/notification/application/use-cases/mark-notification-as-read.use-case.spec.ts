import { BadRequestException } from '@nestjs/common';
import { MarkNotificationAsReadUseCase } from './mark-notification-as-read.use-case';
import { NotificationEntity } from '../../domain/notification.entity';

function makeNotification() {
    return new NotificationEntity(
        'notification-1',
        'team-1',
        'user-2',
        'mention',
        'user-1',
        '김슬랙',
        '메시지에서 멘션됐어요.',
        'message',
        'message-1',
        'channel-1',
        true,
        new Date(),
    );
}

describe('MarkNotificationAsReadUseCase', () => {
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

    let useCase: MarkNotificationAsReadUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new MarkNotificationAsReadUseCase(mockRepo as any, mockGateway as any);
    });

    it('읽음 처리 후 읽음 이벤트를 전파함', async () => {
        const notification = makeNotification();
        mockRepo.markAsRead.mockResolvedValue(notification);

        const result = await useCase.execute('notification-1', 'user-2');

        expect(result).toBe(notification);
        expect(mockRepo.markAsRead).toHaveBeenCalledWith('notification-1', 'user-2');
        expect(mockGateway.emitNotificationRead).toHaveBeenCalledWith('team-1', 'user-2', 'notification-1');
    });

    it('알림이 없으면 400', async () => {
        mockRepo.markAsRead.mockResolvedValue(null);

        await expect(useCase.execute('missing', 'user-2')).rejects.toThrow(BadRequestException);
        expect(mockGateway.emitNotificationRead).not.toHaveBeenCalled();
    });
});
