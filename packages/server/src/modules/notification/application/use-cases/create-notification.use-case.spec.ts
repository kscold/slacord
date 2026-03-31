import { CreateNotificationUseCase } from './create-notification.use-case';
import { NotificationEntity } from '../../domain/notification.entity';

function makeNotification(id: string, recipientId = 'user-2') {
    return new NotificationEntity(
        id,
        'team-1',
        recipientId,
        'issue_assigned',
        'user-1',
        '김슬랙',
        '이슈 담당자로 지정됐어요.',
        'issue',
        'issue-1',
        'channel-1',
        false,
        new Date(),
    );
}

describe('CreateNotificationUseCase', () => {
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

    let useCase: CreateNotificationUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new CreateNotificationUseCase(mockRepo as any, mockGateway as any);
    });

    it('자기 자신에게는 알림을 만들지 않음', async () => {
        const result = await useCase.execute({
            teamId: 'team-1',
            recipientId: 'user-1',
            type: 'issue_assigned',
            actorId: 'user-1',
            actorName: '김슬랙',
            content: '알림',
            resourceType: 'issue',
            resourceId: 'issue-1',
        });

        expect(result).toBeNull();
        expect(mockRepo.save).not.toHaveBeenCalled();
        expect(mockGateway.emitNotification).not.toHaveBeenCalled();
    });

    it('채널 ID가 없으면 null로 저장하고 소켓 이벤트를 보냄', async () => {
        const notification = makeNotification('notification-1');
        mockRepo.save.mockResolvedValue(notification);

        const result = await useCase.execute({
            teamId: 'team-1',
            recipientId: 'user-2',
            type: 'issue_assigned',
            actorId: 'user-1',
            actorName: '김슬랙',
            content: '알림',
            resourceType: 'issue',
            resourceId: 'issue-1',
        });

        expect(result).toBe(notification);
        expect(mockRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                recipientId: 'user-2',
                channelId: null,
            }),
        );
        expect(mockGateway.emitNotification).toHaveBeenCalledWith(notification);
    });

    it('벌크 생성 시 자기 자신 알림은 제외하고 각각 전파함', async () => {
        const notification1 = makeNotification('notification-1', 'user-2');
        const notification2 = makeNotification('notification-2', 'user-3');
        mockRepo.save
            .mockResolvedValueOnce(notification1)
            .mockResolvedValueOnce(notification2);

        const result = await useCase.executeBulk([
            {
                teamId: 'team-1',
                recipientId: 'user-1',
                type: 'issue_assigned',
                actorId: 'user-1',
                actorName: '김슬랙',
                content: '알림',
                resourceType: 'issue',
                resourceId: 'issue-1',
            },
            {
                teamId: 'team-1',
                recipientId: 'user-2',
                type: 'issue_assigned',
                actorId: 'user-1',
                actorName: '김슬랙',
                content: '알림',
                resourceType: 'issue',
                resourceId: 'issue-1',
                channelId: 'channel-1',
            },
            {
                teamId: 'team-1',
                recipientId: 'user-3',
                type: 'thread_reply',
                actorId: 'user-1',
                actorName: '김슬랙',
                content: '답글',
                resourceType: 'message',
                resourceId: 'message-1',
            },
        ]);

        expect(result).toEqual([notification1, notification2]);
        expect(mockRepo.save).toHaveBeenCalledTimes(2);
        expect(mockGateway.emitNotification).toHaveBeenNthCalledWith(1, notification1);
        expect(mockGateway.emitNotification).toHaveBeenNthCalledWith(2, notification2);
    });
});
