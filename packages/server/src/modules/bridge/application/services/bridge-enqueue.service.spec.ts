import { BridgeEnqueueService } from './bridge-enqueue.service';
import { AnnouncementEntity } from '../../../announcement/domain/announcement.entity';
import { TeamEntity, createDefaultBridgeWorkerConfig } from '../../../team/domain/team.entity';

function makeTeam() {
    const config = createDefaultBridgeWorkerConfig();
    config.slack = {
        enabled: true,
        webhookUrl: 'https://hooks.slack.com/services/test/bridge/path',
        relayAnnouncements: true,
        relayGithub: false,
    };
    config.discord = {
        enabled: true,
        webhookUrl: 'https://discord.com/api/webhooks/test/bridge',
        relayAnnouncements: false,
        relayGithub: true,
    };
    return new TeamEntity(
        'team-1',
        'Slacord',
        'slacord',
        null,
        null,
        [],
        [],
        null,
        config,
        new Date('2025-01-01T00:00:00.000Z'),
    );
}

describe('BridgeEnqueueService', () => {
    const mockTeamRepo = {
        findById: jest.fn(),
    };
    const mockBridgeJobRepo = {
        enqueueMany: jest.fn(),
    };

    let service: BridgeEnqueueService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(makeTeam());
        service = new BridgeEnqueueService(mockTeamRepo as any, mockBridgeJobRepo as any);
    });

    it('공지는 relayAnnouncements가 켜진 플랫폼만 큐에 넣는다', async () => {
        const announcement = new AnnouncementEntity(
            'announcement-1',
            'team-1',
            '공지 제목',
            '공지 본문',
            false,
            'user-1',
            new Date('2025-01-01T00:00:00.000Z'),
            new Date('2025-01-01T00:00:00.000Z'),
        );

        const count = await service.enqueueAnnouncement(announcement);

        expect(count).toBe(1);
        expect(mockBridgeJobRepo.enqueueMany).toHaveBeenCalledWith([
            expect.objectContaining({
                teamId: 'team-1',
                platform: 'slack',
                eventType: 'announcement',
                title: '공지 제목',
            }),
        ]);
    });

    it('GitHub 이벤트는 relayGithub가 켜진 플랫폼만 큐에 넣는다', async () => {
        const count = await service.enqueueGithubEvent('team-1', {
            url: 'https://github.com/openai/slacord/pull/42',
            repoName: 'openai/slacord',
            actor: 'alice',
            toCardContent: () => '[PR #42] add relay worker',
        } as any);

        expect(count).toBe(1);
        expect(mockBridgeJobRepo.enqueueMany).toHaveBeenCalledWith([
            expect.objectContaining({
                teamId: 'team-1',
                platform: 'discord',
                eventType: 'github',
                title: '[PR #42] add relay worker',
            }),
        ]);
    });
});
