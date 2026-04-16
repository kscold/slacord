import { BadRequestException } from '@nestjs/common';
import { UpdateBridgeConfigUseCase } from './update-bridge-config.use-case';
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
        null,
        createDefaultBridgeWorkerConfig(),
        new Date('2025-01-01T00:00:00.000Z'),
    );
}

describe('UpdateBridgeConfigUseCase', () => {
    const team = makeTeam();
    const mockTeamRepo = {
        findById: jest.fn(),
        updateBridgeConfig: jest.fn(),
    };

    let useCase: UpdateBridgeConfigUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(team);
        mockTeamRepo.updateBridgeConfig.mockImplementation(async (_teamId, config) => new TeamEntity(
            team.id,
            team.name,
            team.slug,
            team.description,
            team.iconUrl,
            team.members,
            team.inviteLinks,
            team.githubConfig,
            config,
            team.createdAt,
        ));
        useCase = new UpdateBridgeConfigUseCase(mockTeamRepo as any);
    });

    it('관리자는 Slack/Discord bridge 설정을 저장할 수 있다', async () => {
        const result = await useCase.execute('team-1', 'owner-1', {
            slack: {
                enabled: true,
                webhookUrl: 'https://hooks.slack.com/services/test/bridge/path',
                relayAnnouncements: true,
                relayGithub: false,
            },
            discord: {
                enabled: false,
                webhookUrl: '',
                relayAnnouncements: false,
                relayGithub: false,
            },
        });

        expect(mockTeamRepo.updateBridgeConfig).toHaveBeenCalledWith(
            'team-1',
            expect.any(Object),
            expect.objectContaining({
                action: 'bridge_config_updated',
                category: 'delivery',
                summary: 'Slack/Discord 브리지 설정을 저장함',
            }),
        );
        expect(result.bridgeConfig.slack.enabled).toBe(true);
        expect(result.bridgeConfig.slack.relayAnnouncements).toBe(true);
    });

    it('유효하지 않은 webhook URL은 거부한다', async () => {
        await expect(
            useCase.execute('team-1', 'owner-1', {
                slack: {
                    enabled: true,
                    webhookUrl: 'not-a-url',
                    relayAnnouncements: true,
                    relayGithub: false,
                },
                discord: createDefaultBridgeWorkerConfig().discord,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('관리자가 아니면 bridge 설정을 바꿀 수 없다', async () => {
        await expect(
            useCase.execute('team-1', 'member-1', createDefaultBridgeWorkerConfig()),
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});
