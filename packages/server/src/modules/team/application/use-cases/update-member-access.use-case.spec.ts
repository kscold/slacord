import { BadRequestException } from '@nestjs/common';
import { UpdateMemberAccessUseCase } from './update-member-access.use-case';
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
            { userId: 'member-1', role: 'member', joinedAt: new Date('2025-01-02T00:00:00.000Z'), canManageInvites: true },
        ],
        [],
        null,
        createDefaultBridgeWorkerConfig(),
        new Date('2025-01-01T00:00:00.000Z'),
    );
}

describe('UpdateMemberAccessUseCase', () => {
    const team = makeTeam();
    const mockTeamRepo = {
        findById: jest.fn(),
        replaceAccess: jest.fn(),
    };

    let useCase: UpdateMemberAccessUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.findById.mockResolvedValue(team);
        mockTeamRepo.replaceAccess.mockImplementation(async (_teamId, members) => new TeamEntity(
            team.id,
            team.name,
            team.slug,
            team.description,
            team.iconUrl,
            members,
            team.inviteLinks,
            team.githubConfig,
            createDefaultBridgeWorkerConfig(),
            team.createdAt,
        ));
        useCase = new UpdateMemberAccessUseCase(mockTeamRepo as any);
    });

    it('guest로 변경하면 초대 위임을 자동 해제한다', async () => {
        const result = await useCase.execute('team-1', 'owner-1', 'member-1', {
            role: 'guest',
            canManageInvites: true,
        });

        expect(mockTeamRepo.replaceAccess).toHaveBeenCalledWith(
            'team-1',
            expect.any(Array),
            expect.any(Array),
            expect.objectContaining({
                action: 'member_access_updated',
                category: 'access',
                summary: '멤버 접근 권한을 업데이트함',
                target: 'member-1',
            }),
        );
        expect(result).toMatchObject({ role: 'guest', canManageInvites: false });
    });

    it('오너가 아니면 멤버 권한을 변경할 수 없다', async () => {
        await expect(
            useCase.execute('team-1', 'member-1', 'member-1', { role: 'guest' }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});
