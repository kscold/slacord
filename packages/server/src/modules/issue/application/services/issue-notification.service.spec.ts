import { IssueNotificationService } from './issue-notification.service';
import { NOTIFICATION_EVENTS } from '../../../../shared/events/notification-events';

describe('IssueNotificationService', () => {
    const mockEventEmitter = { emit: jest.fn() };

    let service: IssueNotificationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new IssueNotificationService(mockEventEmitter as any);
    });

    it('담당자가 없으면 이벤트를 발행하지 않음', () => {
        service.notifyAssignees({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: [],
            issueId: 'issue-1',
            issueTitle: '로그인 버그',
        });

        expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('배정된 담당자들을 포함한 ISSUE_ASSIGNED 이벤트를 발행함', () => {
        service.notifyAssignees({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: ['user-2', 'user-3'],
            issueId: 'issue-1',
            issueTitle: '로그인 버그',
        });

        expect(mockEventEmitter.emit).toHaveBeenCalledWith(NOTIFICATION_EVENTS.ISSUE_ASSIGNED, {
            teamId: 'team-1',
            recipientIds: ['user-2', 'user-3'],
            actorId: 'user-1',
            issueId: 'issue-1',
            issueTitle: '로그인 버그',
        });
    });
});
