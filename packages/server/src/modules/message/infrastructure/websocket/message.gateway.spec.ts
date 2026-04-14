import { MessageGateway } from './message.gateway';

describe('MessageGateway', () => {
    const mockSendMessageUseCase = { execute: jest.fn() };
    const mockReactMessageUseCase = { execute: jest.fn() };
    const mockMessageAccessService = { ensureChannelMember: jest.fn(), ensureChannelWriter: jest.fn(), ensureMessageInChannel: jest.fn() };
    const mockJwtService = { verify: jest.fn() };

    let gateway: MessageGateway;
    let emitMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        gateway = new MessageGateway(
            mockSendMessageUseCase as any,
            mockReactMessageUseCase as any,
            mockMessageAccessService as any,
            mockJwtService as any,
        );
        emitMock = jest.fn();
        gateway.server = {
            to: jest.fn().mockReturnValue({ emit: emitMock }),
        } as any;
        (gateway as any).huddleRooms.set('channel-1', new Map([
            ['user-1', { audio: true, video: false }],
            ['user-2', { audio: true, video: false }],
            ['user-3', { audio: true, video: false }],
        ]));
        mockMessageAccessService.ensureChannelWriter.mockResolvedValue({
            channel: { id: 'channel-1', teamId: 'team-1' },
        });
    });

    it('허들 offer를 지정한 상대 user room으로만 전달한다', async () => {
        const client = {
            data: { user: { userId: 'user-1', email: 'user-1@example.com' } },
            emit: jest.fn(),
        } as any;

        await gateway.handleHuddleOffer({
            channelId: 'channel-1',
            targetUserId: 'user-2',
            offer: { type: 'offer', sdp: 'test-offer' },
        }, client);

        expect(mockMessageAccessService.ensureChannelWriter).toHaveBeenCalledWith('channel-1', 'user-1');
        expect(gateway.server.to).toHaveBeenCalledWith('user:user-2');
        expect(emitMock).toHaveBeenCalledWith('huddle:offer', {
            channelId: 'channel-1',
            fromUserId: 'user-1',
            offer: { type: 'offer', sdp: 'test-offer' },
        });
    });
});
