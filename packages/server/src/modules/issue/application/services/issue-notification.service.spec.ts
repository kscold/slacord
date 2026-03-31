import { UserEntity } from '../../../auth/domain/user.entity';
import { IssueNotificationService } from './issue-notification.service';

describe('IssueNotificationService', () => {
    const mockUserRepo = {
        existsByEmail: jest.fn(),
        save: jest.fn(),
        findByEmail: jest.fn(),
        findById: jest.fn(),
    };

    const mockCreateNotificationUseCase = {
        execute: jest.fn(),
        executeBulk: jest.fn(),
    };

    let service: IssueNotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new IssueNotificationService(mockUserRepo as any, mockCreateNotificationUseCase as any);
    });

    it('담당자가 없으면 알림을 만들지 않음', async () => {
        await service.notifyAssignees({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: [],
            issueId: 'issue-1',
            issueTitle: '로그인 버그',
        });

        expect(mockUserRepo.findById).not.toHaveBeenCalled();
        expect(mockCreateNotificationUseCase.executeBulk).not.toHaveBeenCalled();
    });

    it('배정된 담당자들에게 일괄 알림을 보냄', async () => {
        mockUserRepo.findById.mockResolvedValue(
            new UserEntity('user-1', 'actor@example.com', '김슬랙', 'hash', null, new Date()),
        );

        await service.notifyAssignees({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: ['user-2', 'user-3'],
            issueId: 'issue-1',
            issueTitle: '로그인 버그',
        });

        expect(mockUserRepo.findById).toHaveBeenCalledWith('user-1');
        expect(mockCreateNotificationUseCase.executeBulk).toHaveBeenCalledWith([
            expect.objectContaining({
                recipientId: 'user-2',
                actorName: '김슬랙',
                content: '이슈 "로그인 버그" 담당자로 지정됐어요.',
            }),
            expect.objectContaining({
                recipientId: 'user-3',
                actorName: '김슬랙',
                content: '이슈 "로그인 버그" 담당자로 지정됐어요.',
            }),
        ]);
    });

    it('작성자를 찾지 못하면 기본 이름으로 알림을 보냄', async () => {
        mockUserRepo.findById.mockResolvedValue(null);

        await service.notifyAssignees({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: ['user-2'],
            issueId: 'issue-1',
            issueTitle: '로그인 버그',
        });

        expect(mockCreateNotificationUseCase.executeBulk).toHaveBeenCalledWith([
            expect.objectContaining({
                actorName: '팀 동료',
            }),
        ]);
    });
});
