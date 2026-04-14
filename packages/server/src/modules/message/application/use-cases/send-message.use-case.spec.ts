import { MessageEntity } from '../../domain/message.entity';
import { SendMessageUseCase } from './send-message.use-case';

function makeMessage(id: string, mentions: string[]) {
    return new MessageEntity(
        id,
        'team-1',
        'channel-1',
        'user-1',
        'writer',
        'hello',
        'text',
        [],
        null,
        [],
        mentions,
        null,
        null,
        false,
        false,
        null,
        new Date('2026-04-14T01:00:00.000Z'),
        new Date('2026-04-14T01:00:00.000Z'),
    );
}

describe('SendMessageUseCase', () => {
    const mockMessageRepo = {
        save: jest.fn(),
        findById: jest.fn(),
    };
    const mockCreateNotification = {
        execute: jest.fn(),
        executeBulk: jest.fn(),
    };
    const mockTeamRepo = {
        findById: jest.fn(),
    };
    const mockUserRepo = {
        findByIds: jest.fn(),
    };

    let useCase: SendMessageUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SendMessageUseCase(
            mockMessageRepo as any,
            mockCreateNotification as any,
            mockTeamRepo as any,
            mockUserRepo as any,
        );
    });

    it('팀 멤버 username을 실제 사용자 ID로 해석해 멘션 알림을 만든다', async () => {
        const savedMessage = makeMessage('message-1', ['user-2', 'user-3']);
        mockTeamRepo.findById.mockResolvedValue({
            members: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
        });
        mockUserRepo.findByIds.mockResolvedValue([
            { id: 'user-1', username: 'writer' },
            { id: 'user-2', username: 'Alice' },
            { id: 'user-3', username: 'bob' },
        ]);
        mockMessageRepo.save.mockResolvedValue(savedMessage);

        const result = await useCase.execute({
            teamId: 'team-1',
            channelId: 'channel-1',
            authorId: 'user-1',
            authorName: 'writer',
            content: '안녕 @alice, @bob! @missing @writer',
        });

        expect(mockMessageRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                mentions: ['user-2', 'user-3'],
            }),
        );
        expect(mockCreateNotification.executeBulk).toHaveBeenCalledWith([
            expect.objectContaining({ recipientId: 'user-2', type: 'mention' }),
            expect.objectContaining({ recipientId: 'user-3', type: 'mention' }),
        ]);
        expect(result).toBe(savedMessage);
    });
});
