import { ChannelEntity } from '../../domain/channel.entity';
import { GetChannelsUseCase } from './get-channels.use-case';

function makeChannel(id: string, type: 'public' | 'private' | 'dm' | 'group' | 'voice', memberIds: string[] = []) {
    return new ChannelEntity(
        id,
        'team-1',
        `channel-${id}`,
        null,
        type,
        'user-1',
        memberIds,
        null,
        null,
        new Date('2026-04-14T00:00:00.000Z'),
    );
}

function makeFindOneChain(createdAt: Date | null) {
    return {
        sort: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(createdAt ? { createdAt } : null),
            }),
        }),
    };
}

describe('GetChannelsUseCase', () => {
    const mockChannelRepo = {
        findByTeam: jest.fn(),
    };
    const mockTeamRepo = {
        findById: jest.fn(),
    };
    const mockChannelReadRepo = {
        findByChannelIdsForUser: jest.fn(),
        markRead: jest.fn(),
    };
    const mockMessageModel = {
        findOne: jest.fn(),
        countDocuments: jest.fn(),
    };

    let useCase: GetChannelsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetChannelsUseCase(
            mockChannelRepo as any,
            mockTeamRepo as any,
            mockChannelReadRepo as any,
            mockMessageModel as any,
        );
    });

    it('처음 보는 채널은 최신 메시지를 기준으로 baseline read state를 만든다', async () => {
        const channel = makeChannel('channel-1', 'public');
        const latestMessageAt = new Date('2026-04-14T09:00:00.000Z');
        mockTeamRepo.findById.mockResolvedValue({ isMember: () => true });
        mockChannelRepo.findByTeam.mockResolvedValue([channel]);
        mockChannelReadRepo.findByChannelIdsForUser.mockResolvedValue([]);
        mockMessageModel.findOne.mockReturnValue(makeFindOneChain(latestMessageAt));

        const result = await useCase.execute('team-1', 'user-1');

        expect(mockChannelReadRepo.markRead).toHaveBeenCalledWith({
            teamId: 'team-1',
            channelId: 'channel-1',
            userId: 'user-1',
            lastReadAt: latestMessageAt,
        });
        expect(result).toEqual([
            expect.objectContaining({
                channel,
                unreadCount: 0,
                mentionCount: 0,
                lastReadAt: latestMessageAt,
                lastMessageAt: latestMessageAt,
            }),
        ]);
    });

    it('기존 읽음 상태가 있으면 unread와 mention 카운트를 계산한다', async () => {
        const publicChannel = makeChannel('channel-1', 'public');
        const privateChannel = makeChannel('channel-2', 'private', ['user-1']);
        mockTeamRepo.findById.mockResolvedValue({ isMember: () => true });
        mockChannelRepo.findByTeam.mockResolvedValue([publicChannel, privateChannel]);
        mockChannelReadRepo.findByChannelIdsForUser.mockResolvedValue([
            { channelId: 'channel-1', lastReadAt: new Date('2026-04-14T08:00:00.000Z') },
            { channelId: 'channel-2', lastReadAt: new Date('2026-04-14T08:30:00.000Z') },
        ]);
        mockMessageModel.findOne
            .mockReturnValueOnce(makeFindOneChain(new Date('2026-04-14T09:00:00.000Z')))
            .mockReturnValueOnce(makeFindOneChain(new Date('2026-04-14T10:00:00.000Z')));
        mockMessageModel.countDocuments
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(0);

        const result = await useCase.execute('team-1', 'user-1');

        expect(result).toEqual([
            expect.objectContaining({ channel: publicChannel, unreadCount: 3, mentionCount: 1 }),
            expect.objectContaining({ channel: privateChannel, unreadCount: 2, mentionCount: 0 }),
        ]);
        expect(mockChannelReadRepo.markRead).not.toHaveBeenCalled();
    });
});
