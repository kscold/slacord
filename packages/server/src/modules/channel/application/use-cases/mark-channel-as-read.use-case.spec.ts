import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChannelEntity } from '../../domain/channel.entity';
import { MarkChannelAsReadUseCase } from './mark-channel-as-read.use-case';

function makeChannel(type: 'public' | 'private' | 'dm' | 'group' | 'voice', memberIds: string[] = []) {
    return new ChannelEntity(
        'channel-1',
        'team-1',
        'general',
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

describe('MarkChannelAsReadUseCase', () => {
    const mockChannelRepo = {
        findById: jest.fn(),
    };
    const mockTeamRepo = {
        findById: jest.fn(),
    };
    const mockChannelReadRepo = {
        markRead: jest.fn(),
    };
    const mockMessageModel = {
        findOne: jest.fn(),
    };

    let useCase: MarkChannelAsReadUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new MarkChannelAsReadUseCase(
            mockChannelRepo as any,
            mockTeamRepo as any,
            mockChannelReadRepo as any,
            mockMessageModel as any,
        );
    });

    it('접근 가능한 채널을 최신 메시지 시각으로 읽음 처리한다', async () => {
        const lastReadAt = new Date('2026-04-14T11:00:00.000Z');
        mockChannelRepo.findById.mockResolvedValue(makeChannel('public'));
        mockTeamRepo.findById.mockResolvedValue({ isMember: () => true });
        mockMessageModel.findOne.mockReturnValue(makeFindOneChain(lastReadAt));
        mockChannelReadRepo.markRead.mockResolvedValue({ channelId: 'channel-1', userId: 'user-1', lastReadAt });

        const result = await useCase.execute('channel-1', 'user-1');

        expect(mockChannelReadRepo.markRead).toHaveBeenCalledWith({
            teamId: 'team-1',
            channelId: 'channel-1',
            userId: 'user-1',
            lastReadAt,
        });
        expect(result).toEqual({ channelId: 'channel-1', userId: 'user-1', lastReadAt });
    });

    it('비공개 채널 비멤버 접근은 막는다', async () => {
        mockChannelRepo.findById.mockResolvedValue(makeChannel('private', ['user-2']));
        mockTeamRepo.findById.mockResolvedValue({ isMember: () => true });

        await expect(useCase.execute('channel-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('채널이 없으면 not found를 던진다', async () => {
        mockChannelRepo.findById.mockResolvedValue(null);

        await expect(useCase.execute('channel-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
});
