import { ImportDiscordGuildUseCase } from './import-discord-guild.use-case';

describe('ImportDiscordGuildUseCase', () => {
    const mockDiscordClient = {
        getGuildSnapshot: jest.fn(),
        getAllChannelMessages: jest.fn(),
    };

    const mockTeamRepo = {
        findById: jest.fn(),
    };

    const mockChannelRepo = {
        findByTeam: jest.fn(),
        findByExternalRef: jest.fn(),
        saveImported: jest.fn(),
    };

    const mockMessageRepo = {
        findByExternalRef: jest.fn(),
        saveImported: jest.fn(),
        updateImported: jest.fn(),
    };

    let useCase: ImportDiscordGuildUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ImportDiscordGuildUseCase(
            mockDiscordClient as any,
            mockTeamRepo as any,
            mockChannelRepo as any,
            mockMessageRepo as any,
        );
    });

    it('재가져오기 시 기존 external ref를 재사용하고 중복 저장하지 않는다', async () => {
        mockTeamRepo.findById.mockResolvedValue({
            getMember: () => ({ role: 'owner' }),
        });
        mockDiscordClient.getGuildSnapshot.mockResolvedValue({
            guild: { id: 'guild-1', name: 'Guild' },
            memberCount: 10,
            channels: [{ id: 'discord-channel-1', name: 'general', topic: 'topic' }],
        });
        mockDiscordClient.getAllChannelMessages.mockResolvedValue([
            {
                id: 'discord-message-1',
                type: 0,
                content: 'hello',
                timestamp: '2024-01-01T00:00:00.000Z',
                edited_timestamp: null,
                pinned: false,
                attachments: [],
                mentions: [],
                embeds: [],
                author: { id: 'discord-user-1', username: 'alice' },
                member: { nick: 'Alice' },
                message_reference: null,
            },
        ]);
        mockChannelRepo.findByTeam.mockResolvedValue([{ name: 'general' }]);
        mockChannelRepo.findByExternalRef.mockResolvedValue({
            id: 'channel-1',
            name: 'general',
        });
        mockMessageRepo.findByExternalRef.mockResolvedValue({
            id: 'message-1',
        });
        mockMessageRepo.updateImported.mockResolvedValue({
            id: 'message-1',
        });

        const result = await useCase.execute({
            teamId: 'team-1',
            requestedBy: 'user-owner',
            botToken: 'token',
            guildId: 'guild-1',
        });

        expect(mockChannelRepo.saveImported).not.toHaveBeenCalled();
        expect(mockMessageRepo.saveImported).not.toHaveBeenCalled();
        expect(mockMessageRepo.updateImported).toHaveBeenCalledWith('message-1', expect.objectContaining({
            authorId: 'discord:discord-user-1',
            authorName: 'Alice',
            content: 'hello',
        }));
        expect(result.updatedMessages).toBe(1);
    });
});
