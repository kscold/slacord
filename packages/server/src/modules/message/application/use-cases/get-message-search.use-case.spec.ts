import { GetMessageSearchUseCase } from './get-message-search.use-case';

function makeMessage(overrides: Partial<any> = {}) {
    return {
        id: overrides.id ?? 'message-1',
        teamId: overrides.teamId ?? 'team-1',
        channelId: overrides.channelId ?? 'channel-1',
        authorId: overrides.authorId ?? 'user-1',
        authorName: overrides.authorName ?? 'owner',
        content: overrides.content ?? 'default content',
        type: overrides.type ?? 'text',
        attachments: overrides.attachments ?? [],
        replyToId: overrides.replyToId ?? null,
        reactions: overrides.reactions ?? [],
        mentions: overrides.mentions ?? [],
        externalSource: null,
        externalId: null,
        isEdited: false,
        isPinned: overrides.isPinned ?? false,
        pinnedAt: overrides.pinnedAt ?? null,
        createdAt: overrides.createdAt ?? new Date('2026-04-16T00:00:00.000Z'),
        updatedAt: overrides.updatedAt ?? new Date('2026-04-16T00:00:00.000Z'),
    };
}

describe('GetMessageSearchUseCase', () => {
    const messageRepo = {
        findRecentByChannels: jest.fn(),
        findPinnedByChannels: jest.fn(),
        searchByChannels: jest.fn(),
    };
    const teamRepo = {
        findByMember: jest.fn(),
    };
    const channelRepo = {
        findByTeam: jest.fn(),
    };

    let useCase: GetMessageSearchUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetMessageSearchUseCase(messageRepo as any, teamRepo as any, channelRepo as any);
    });

    it('쿼리가 없으면 recent와 pinned 개요를 반환한다', async () => {
        teamRepo.findByMember.mockResolvedValue([{ id: 'team-1', name: 'Alpha' }]);
        channelRepo.findByTeam.mockResolvedValue([
            { id: 'channel-1', name: 'general', type: 'public', isMember: () => true },
        ]);
        messageRepo.findRecentByChannels.mockResolvedValue([makeMessage({ id: 'recent-1', content: 'latest update' })]);
        messageRepo.findPinnedByChannels.mockResolvedValue([
            makeMessage({ id: 'pin-1', content: 'pinned update', isPinned: true }),
        ]);

        const result = await useCase.execute({ userId: 'user-1' });

        expect(messageRepo.findRecentByChannels).toHaveBeenCalledWith(['channel-1'], 8);
        expect(messageRepo.findPinnedByChannels).toHaveBeenCalledWith(['channel-1'], 6);
        expect(result.teamCount).toBe(1);
        expect(result.recentResults).toHaveLength(1);
        expect(result.pinnedResults).toHaveLength(1);
        expect(result.results).toEqual([]);
    });

    it('쿼리가 있으면 메시지 내용과 채널 이름 기준으로 결과를 합쳐서 반환한다', async () => {
        teamRepo.findByMember.mockResolvedValue([{ id: 'team-1', name: 'Alpha Team' }]);
        channelRepo.findByTeam.mockResolvedValue([
            { id: 'channel-1', name: 'general', type: 'public', isMember: () => true },
            { id: 'channel-2', name: 'release-room', type: 'private', isMember: () => true },
        ]);
        messageRepo.searchByChannels.mockResolvedValue([
            makeMessage({
                id: 'message-1',
                channelId: 'channel-1',
                content: 'release note posted',
                createdAt: new Date('2026-04-16T00:10:00.000Z'),
            }),
        ]);
        messageRepo.findRecentByChannels.mockResolvedValue([
            makeMessage({
                id: 'message-2',
                channelId: 'channel-2',
                content: 'channel metadata fallback',
                createdAt: new Date('2026-04-16T00:09:00.000Z'),
            }),
        ]);

        const result = await useCase.execute({ userId: 'user-1', query: 'release' });

        expect(messageRepo.searchByChannels).toHaveBeenCalled();
        expect(messageRepo.findRecentByChannels).toHaveBeenCalledWith(['channel-2'], 30);
        expect(result.results.map((item) => item.id)).toEqual(['message-1', 'message-2']);
        expect(result.results[1]).toMatchObject({
            channelName: 'release-room',
            teamName: 'Alpha Team',
        });
    });

    it('dm과 group 채널은 검색 scope에서 제외한다', async () => {
        teamRepo.findByMember.mockResolvedValue([{ id: 'team-1', name: 'Alpha Team' }]);
        channelRepo.findByTeam.mockResolvedValue([
            { id: 'channel-1', name: 'general', type: 'public', isMember: () => true },
            { id: 'channel-2', name: 'dm-room', type: 'dm', isMember: () => true },
            { id: 'channel-3', name: 'group-room', type: 'group', isMember: () => true },
        ]);
        messageRepo.findRecentByChannels.mockResolvedValue([]);
        messageRepo.findPinnedByChannels.mockResolvedValue([]);

        await useCase.execute({ userId: 'user-1' });

        expect(messageRepo.findRecentByChannels).toHaveBeenCalledWith(['channel-1'], 8);
        expect(messageRepo.findPinnedByChannels).toHaveBeenCalledWith(['channel-1'], 6);
    });
});
