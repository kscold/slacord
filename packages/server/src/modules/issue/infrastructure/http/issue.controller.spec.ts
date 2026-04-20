import { IssueController } from './issue.controller';
import { IssueEntity } from '../../domain/issue.entity';

function makeIssue(id: string) {
    return new IssueEntity(
        id,
        'team-1',
        `이슈 ${id}`,
        '설명',
        'todo',
        'medium',
        ['user-2'],
        ['bug'],
        'user-1',
        new Date(),
        new Date(),
    );
}

describe('IssueController', () => {
    const mockCreateIssueUseCase = {
        execute: jest.fn(),
    };

    const mockUpdateIssueUseCase = {
        execute: jest.fn(),
    };

    const mockGetIssuesUseCase = {
        execute: jest.fn(),
    };

    const mockDeleteIssueUseCase = {
        execute: jest.fn(),
    };

    const mockIssueNotificationService = {
        notifyAssignees: jest.fn(),
    };

    let controller: IssueController;

    beforeEach(() => {
        jest.clearAllMocks();
        // 권한 검사는 TeamAccessGuard(AOP)가 담당하므로 컨트롤러에서 주입받지 않음
        controller = new IssueController(
            mockCreateIssueUseCase as any,
            mockUpdateIssueUseCase as any,
            mockGetIssuesUseCase as any,
            mockDeleteIssueUseCase as any,
            mockIssueNotificationService as any,
        );
    });

    it('이슈 목록 조회 시 검색 필터를 그대로 전달함', async () => {
        const issue = makeIssue('issue-1');
        mockGetIssuesUseCase.execute.mockResolvedValue([issue]);

        const result = await controller.getIssues('team-1', 'in_progress', '로그인', 'user-2');

        expect(mockGetIssuesUseCase.execute).toHaveBeenCalledWith('team-1', {
            status: 'in_progress',
            query: '로그인',
            assigneeId: 'user-2',
        });
        expect(result).toEqual({ success: true, data: [issue.toPublic()] });
    });

    it('이슈 생성 후 담당자 알림을 위임함', async () => {
        const issue = makeIssue('issue-1');
        mockCreateIssueUseCase.execute.mockResolvedValue(issue);
        const dto = {
            title: '로그인 버그',
            description: '설명',
            priority: 'high' as const,
            assigneeIds: ['user-2'],
            labels: ['bug'],
        };

        const result = await controller.createIssue('team-1', { userId: 'user-1' }, dto as any);

        expect(mockCreateIssueUseCase.execute).toHaveBeenCalledWith({
            ...dto,
            teamId: 'team-1',
            createdBy: 'user-1',
        });
        expect(mockIssueNotificationService.notifyAssignees).toHaveBeenCalledWith({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: ['user-2'],
            issueId: 'issue-1',
            issueTitle: '이슈 issue-1',
        });
        expect(result).toEqual({ success: true, data: issue.toPublic() });
    });

    it('이슈 수정 후 새로 추가된 담당자에게만 알림을 위임함', async () => {
        const issue = makeIssue('issue-1');
        mockUpdateIssueUseCase.execute.mockResolvedValue({ updated: issue, previousAssigneeIds: [] });
        const dto = {
            status: 'done' as const,
            assigneeIds: ['user-3'],
        };

        const result = await controller.updateIssue('team-1', 'issue-1', { userId: 'user-1' }, dto as any);

        expect(mockUpdateIssueUseCase.execute).toHaveBeenCalledWith({
            id: 'issue-1',
            ...dto,
        });
        expect(mockIssueNotificationService.notifyAssignees).toHaveBeenCalledWith({
            teamId: 'team-1',
            actorId: 'user-1',
            assigneeIds: ['user-3'],
            issueId: 'issue-1',
            issueTitle: '이슈 issue-1',
        });
        expect(result).toEqual({ success: true, data: issue.toPublic() });
    });

    it('기존 담당자에게는 중복 알림을 보내지 않음', async () => {
        const issue = makeIssue('issue-1');
        mockUpdateIssueUseCase.execute.mockResolvedValue({
            updated: issue,
            previousAssigneeIds: ['user-2'],
        });

        await controller.updateIssue('team-1', 'issue-1', { userId: 'user-1' }, { assigneeIds: ['user-2'] } as any);

        expect(mockIssueNotificationService.notifyAssignees).not.toHaveBeenCalled();
    });

    it('이슈 삭제를 위임함', async () => {
        const result = await controller.deleteIssue('issue-1');

        expect(mockDeleteIssueUseCase.execute).toHaveBeenCalledWith('issue-1');
        expect(result).toEqual({ success: true });
    });
});
