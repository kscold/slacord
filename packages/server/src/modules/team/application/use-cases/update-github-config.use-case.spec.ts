import { BadRequestException } from '@nestjs/common';
import { UpdateGithubConfigUseCase } from './update-github-config.use-case';

describe('UpdateGithubConfigUseCase', () => {
    const mockTeamRepo = {
        findById: jest.fn(),
        updateGithubConfig: jest.fn(),
    };

    let useCase: UpdateGithubConfigUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new UpdateGithubConfigUseCase(mockTeamRepo as any);
    });

    it('관리자는 저장소 URL을 정규화해서 저장할 수 있다', async () => {
        const team = { hasAdminAccess: (userId: string) => userId === 'user-admin' };
        mockTeamRepo.findById.mockResolvedValue(team);
        mockTeamRepo.updateGithubConfig.mockResolvedValue({ id: 'team-1' });

        const result = await useCase.execute('team-1', 'user-admin', {
            repoUrl: 'openai/slacord',
            webhookSecret: 'secret',
            notifyChannelId: 'channel-1',
        });

        expect(mockTeamRepo.updateGithubConfig).toHaveBeenCalledWith('team-1', {
            repoUrl: 'https://github.com/openai/slacord',
            webhookSecret: 'secret',
            notifyChannelId: 'channel-1',
        });
        expect(result).toEqual({ id: 'team-1' });
    });

    it('관리자가 아니면 GitHub 설정을 바꿀 수 없다', async () => {
        mockTeamRepo.findById.mockResolvedValue({ hasAdminAccess: () => false });

        await expect(useCase.execute('team-1', 'user-member', {
            repoUrl: 'https://github.com/openai/slacord',
            webhookSecret: 'secret',
            notifyChannelId: 'channel-1',
        })).rejects.toBeInstanceOf(BadRequestException);
        expect(mockTeamRepo.updateGithubConfig).not.toHaveBeenCalled();
    });
});
