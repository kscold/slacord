import { BadRequestException } from '@nestjs/common';
import { GetTeamAuditLogsUseCase } from './get-team-audit-logs.use-case';
import { TeamEntity, createDefaultBridgeWorkerConfig, createTeamAuditLogEntry } from '../../domain/team.entity';

function makeTeam() {
    return new TeamEntity(
        'team-1',
        'Slacord',
        'slacord',
        null,
        null,
        [
            { userId: 'owner-1', role: 'owner', joinedAt: new Date('2025-01-01T00:00:00.000Z'), canManageInvites: true },
            { userId: 'member-1', role: 'member', joinedAt: new Date('2025-01-02T00:00:00.000Z'), canManageInvites: false },
        ],
        [],
        null,
        createDefaultBridgeWorkerConfig(),
        new Date('2025-01-01T00:00:00.000Z'),
        [
            createTeamAuditLogEntry({
                actorId: 'owner-1',
                category: 'bridge',
                action: 'bridge_job_retried',
                summary: '실패한 브리지 relay를 다시 시도함',
                target: 'bridge failed',
                createdAt: new Date('2025-01-03T00:00:00.000Z'),
            }),
            createTeamAuditLogEntry({
                actorId: 'owner-1',
                category: 'access',
                action: 'invite_link_created',
                summary: '초대 링크를 생성함',
                target: 'invite',
                createdAt: new Date('2025-01-02T00:00:00.000Z'),
            }),
        ],
    );
}

describe('GetTeamAuditLogsUseCase', () => {
    const mockTeamRepo = {
        findById: jest.fn(),
    };

    let useCase: GetTeamAuditLogsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        useCase = new GetTeamAuditLogsUseCase(mockTeamRepo as any);
    });

    it('관리자는 최신 운영 감사 로그를 조회할 수 있다', async () => {
        const result = await useCase.execute('team-1', 'owner-1');

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            action: 'bridge_job_retried',
            category: 'bridge',
        });
    });

    it('카테고리 필터를 적용할 수 있다', async () => {
        const result = await useCase.execute('team-1', 'owner-1', { category: 'access' });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            action: 'invite_link_created',
            category: 'access',
        });
    });

    it('관리자가 아니면 운영 감사 로그를 볼 수 없다', async () => {
        await expect(useCase.execute('team-1', 'member-1')).rejects.toBeInstanceOf(BadRequestException);
    });
});
