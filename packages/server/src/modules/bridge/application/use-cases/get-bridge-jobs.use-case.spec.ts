import { BadRequestException } from '@nestjs/common';
import { GetBridgeJobsUseCase } from './get-bridge-jobs.use-case';
import { BridgeJobEntity } from '../../domain/bridge-job.entity';
import { TeamEntity, createDefaultBridgeWorkerConfig } from '../../../team/domain/team.entity';

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
    );
}

function makeJob(id: string) {
    return new BridgeJobEntity(
        id,
        'team-1',
        'slack',
        'announcement',
        'https://hooks.slack.com/services/test/bridge/path',
        `job-${id}`,
        'bridge content',
        null,
        'sent',
        1,
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-01T00:00:10.000Z'),
        null,
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-01T00:00:10.000Z'),
    );
}

describe('GetBridgeJobsUseCase', () => {
    const mockTeamRepo = {
        findById: jest.fn(),
    };
    const mockBridgeJobRepo = {
        listRecent: jest.fn(),
    };

    let useCase: GetBridgeJobsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        mockBridgeJobRepo.listRecent.mockResolvedValue([makeJob('job-1')]);
        useCase = new GetBridgeJobsUseCase(mockTeamRepo as any, mockBridgeJobRepo as any);
    });

    it('관리자는 최근 bridge job 목록을 볼 수 있다', async () => {
        const result = await useCase.execute('team-1', 'owner-1', { limit: 50 });

        expect(mockBridgeJobRepo.listRecent).toHaveBeenCalledWith('team-1', {
            limit: 30,
            status: undefined,
            platform: undefined,
            eventType: undefined,
        });
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('sent');
    });

    it('유효한 필터만 넘겨서 bridge job 목록을 조회한다', async () => {
        await useCase.execute('team-1', 'owner-1', {
            limit: 7,
            status: 'failed',
            platform: 'slack',
            eventType: 'announcement',
        });

        expect(mockBridgeJobRepo.listRecent).toHaveBeenCalledWith('team-1', {
            limit: 7,
            status: 'failed',
            platform: 'slack',
            eventType: 'announcement',
        });
    });

    it('알 수 없는 필터 값은 무시한다', async () => {
        await useCase.execute('team-1', 'owner-1', {
            limit: Number.NaN,
            status: 'unknown',
            platform: 'teams',
            eventType: 'note',
        });

        expect(mockBridgeJobRepo.listRecent).toHaveBeenCalledWith('team-1', {
            limit: 12,
            status: undefined,
            platform: undefined,
            eventType: undefined,
        });
    });

    it('관리자가 아니면 bridge job 목록을 볼 수 없다', async () => {
        await expect(useCase.execute('team-1', 'member-1')).rejects.toBeInstanceOf(BadRequestException);
    });
});
