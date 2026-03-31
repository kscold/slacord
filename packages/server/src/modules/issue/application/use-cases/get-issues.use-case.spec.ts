import { GetIssuesUseCase } from './get-issues.use-case';
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

describe('GetIssuesUseCase', () => {
    const mockRepo = {
        findByTeam: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        deleteById: jest.fn(),
    };

    let useCase: GetIssuesUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetIssuesUseCase(mockRepo as any);
    });

    it('필터 없이 팀 이슈 목록을 조회함', async () => {
        mockRepo.findByTeam.mockResolvedValue([makeIssue('issue-1')]);

        const result = await useCase.execute('team-1');

        expect(result).toHaveLength(1);
        expect(mockRepo.findByTeam).toHaveBeenCalledWith('team-1', undefined);
    });

    it('검색 필터를 그대로 레포지토리에 전달함', async () => {
        const filters = { status: 'in_progress' as const, query: '로그인', assigneeId: 'user-2' };
        mockRepo.findByTeam.mockResolvedValue([makeIssue('issue-1')]);

        const result = await useCase.execute('team-1', filters);

        expect(result).toHaveLength(1);
        expect(mockRepo.findByTeam).toHaveBeenCalledWith('team-1', filters);
    });
});
