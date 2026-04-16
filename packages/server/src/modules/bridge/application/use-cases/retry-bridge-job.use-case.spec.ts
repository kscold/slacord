import { BadRequestException } from '@nestjs/common';
import { RetryBridgeJobUseCase } from './retry-bridge-job.use-case';
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
        {
            ...createDefaultBridgeWorkerConfig(),
            slack: {
                enabled: true,
                webhookUrl: 'https://hooks.slack.com/services/test/bridge/retry',
                relayAnnouncements: true,
                relayGithub: true,
            },
        },
        new Date('2025-01-01T00:00:00.000Z'),
    );
}

function makeJob(status: 'failed' | 'sent' = 'failed') {
    return new BridgeJobEntity(
        'job-1',
        'team-1',
        'slack',
        'announcement',
        'https://hooks.slack.com/services/test/bridge/old',
        'bridge failed',
        'payload',
        'https://slacord.dev/announcements/1',
        status,
        3,
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-01T00:00:00.000Z'),
        null,
        '외부 브리지 전송 실패 (500)',
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-01-01T00:00:10.000Z'),
    );
}

describe('RetryBridgeJobUseCase', () => {
    const mockTeamRepo = {
        appendAuditLog: jest.fn(),
        findById: jest.fn(),
    };
    const mockBridgeJobRepo = {
        findById: jest.fn(),
        enqueueMany: jest.fn(),
    };

    let useCase: RetryBridgeJobUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        mockTeamRepo.appendAuditLog.mockResolvedValue(makeTeam());
        mockBridgeJobRepo.findById.mockResolvedValue(makeJob());
        mockBridgeJobRepo.enqueueMany.mockResolvedValue([makeJob('failed')]);
        useCase = new RetryBridgeJobUseCase(mockTeamRepo as any, mockBridgeJobRepo as any);
    });

    it('관리자는 실패한 bridge job을 현재 설정으로 다시 큐잉할 수 있다', async () => {
        await useCase.execute('team-1', 'owner-1', 'job-1');

        expect(mockBridgeJobRepo.enqueueMany).toHaveBeenCalledWith([
            expect.objectContaining({
                teamId: 'team-1',
                platform: 'slack',
                eventType: 'announcement',
                webhookUrl: 'https://hooks.slack.com/services/test/bridge/retry',
                title: 'bridge failed',
                content: 'payload',
                url: 'https://slacord.dev/announcements/1',
            }),
        ]);
        expect(mockTeamRepo.appendAuditLog).toHaveBeenCalledWith(
            'team-1',
            expect.objectContaining({
                action: 'bridge_job_retried',
                category: 'bridge',
                summary: '실패한 브리지 relay를 다시 시도함',
                target: 'bridge failed',
            }),
        );
    });

    it('관리자가 아니면 실패한 bridge job을 다시 시도할 수 없다', async () => {
        await expect(useCase.execute('team-1', 'member-1', 'job-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('실패한 job이 아니면 다시 시도할 수 없다', async () => {
        mockBridgeJobRepo.findById.mockResolvedValue(makeJob('sent'));

        await expect(useCase.execute('team-1', 'owner-1', 'job-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('현재 설정이 꺼져 있으면 다시 시도할 수 없다', async () => {
        const team = makeTeam();
        team.bridgeConfig.slack.enabled = false;
        mockTeamRepo.findById.mockResolvedValue(team);

        await expect(useCase.execute('team-1', 'owner-1', 'job-1')).rejects.toBeInstanceOf(BadRequestException);
    });
});
