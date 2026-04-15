import { BadRequestException } from '@nestjs/common';
import { GetTeamSettingsUseCase } from './get-team-settings.use-case';
import { TeamEntity, createDefaultBridgeWorkerConfig } from '../../domain/team.entity';

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
        {
            repoUrl: 'https://github.com/openai/slacord',
            webhookSecret: 'secret',
            notifyChannelId: 'channel-1',
        },
        createDefaultBridgeWorkerConfig(),
        new Date('2025-01-01T00:00:00.000Z'),
    );
}

describe('GetTeamSettingsUseCase', () => {
    const mockTeamRepo = {
        findById: jest.fn(),
    };

    let useCase: GetTeamSettingsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        useCase = new GetTeamSettingsUseCase(mockTeamRepo as any);
    });

    it('관리자는 민감한 팀 설정을 조회할 수 있다', async () => {
        const result = await useCase.execute('team-1', 'owner-1');

        expect(result.githubConfig?.webhookSecret).toBe('secret');
    });

    it('관리자가 아니면 민감한 팀 설정을 조회할 수 없다', async () => {
        await expect(useCase.execute('team-1', 'member-1')).rejects.toBeInstanceOf(BadRequestException);
    });
});
