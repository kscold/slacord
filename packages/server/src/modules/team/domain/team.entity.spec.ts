import { TeamEntity, createDefaultBridgeWorkerConfig } from './team.entity';

describe('TeamEntity serialization', () => {
    function makeTeam() {
        return new TeamEntity(
            'team-1',
            'Slacord',
            'slacord',
            'workspace',
            null,
            [
                { userId: 'owner-1', role: 'owner', joinedAt: new Date('2025-01-01T00:00:00.000Z'), canManageInvites: true },
                { userId: 'member-1', role: 'member', joinedAt: new Date('2025-01-02T00:00:00.000Z'), canManageInvites: false },
            ],
            [],
            {
                repoUrl: 'https://github.com/openai/slacord',
                webhookSecret: 'super-secret',
                notifyChannelId: 'channel-1',
            },
            {
                ...createDefaultBridgeWorkerConfig(),
                slack: {
                    enabled: true,
                    webhookUrl: 'https://hooks.slack.com/services/test/path',
                    relayAnnouncements: true,
                    relayGithub: false,
                },
                discord: {
                    enabled: false,
                    webhookUrl: '',
                    relayAnnouncements: false,
                    relayGithub: false,
                },
            },
            new Date('2025-01-01T00:00:00.000Z'),
        );
    }

    it('toPublic는 GitHub secret과 bridge webhook url을 숨긴다', () => {
        const publicTeam = makeTeam().toPublic();

        expect(publicTeam.githubConfig).toEqual({
            repoUrl: 'https://github.com/openai/slacord',
            notifyChannelId: 'channel-1',
            hasWebhookSecret: true,
        });
        expect(publicTeam.bridgeConfig).toEqual({
            slack: {
                enabled: true,
                relayAnnouncements: true,
                relayGithub: false,
                hasWebhookUrl: true,
            },
            discord: {
                enabled: false,
                relayAnnouncements: false,
                relayGithub: false,
                hasWebhookUrl: false,
            },
        });
    });

    it('toSettings는 admin 설정 화면용 원본 값을 유지한다', () => {
        const settings = makeTeam().toSettings();

        expect(settings.githubConfig?.webhookSecret).toBe('super-secret');
        expect(settings.bridgeConfig.slack.webhookUrl).toBe('https://hooks.slack.com/services/test/path');
    });
});
