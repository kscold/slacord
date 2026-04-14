import { MessageController } from './message.controller';

function makeMessage(id: string) {
    return {
        id,
        toPublic: () => ({ id, content: `message-${id}` }),
    };
}

describe('MessageController', () => {
    const mockGetMessagesUseCase = { execute: jest.fn() };
    const mockGetPinnedMessagesUseCase = { execute: jest.fn() };
    const mockGetThreadMessagesUseCase = { execute: jest.fn() };
    const mockEditMessageUseCase = { execute: jest.fn() };
    const mockPinMessageUseCase = { execute: jest.fn() };
    const mockDeleteMessageUseCase = { execute: jest.fn() };
    const mockMessageAccessService = {
        ensureChannelMember: jest.fn(),
        ensureMessageInChannel: jest.fn(),
    };
    const mockMessageGateway = {
        emitPinnedUpdated: jest.fn(),
        emitMessageDeleted: jest.fn(),
    };

    let controller: MessageController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new MessageController(
            mockGetMessagesUseCase as any,
            mockGetPinnedMessagesUseCase as any,
            mockGetThreadMessagesUseCase as any,
            mockEditMessageUseCase as any,
            mockPinMessageUseCase as any,
            mockDeleteMessageUseCase as any,
            mockMessageAccessService as any,
            mockMessageGateway as any,
        );
    });

    it('메시지 목록 조회 전에 채널 접근 권한을 확인한다', async () => {
        const message = makeMessage('message-1');
        mockGetMessagesUseCase.execute.mockResolvedValue([message]);

        const result = await controller.getMessages('channel-1', { userId: 'user-1' }, '20', undefined);

        expect(mockMessageAccessService.ensureChannelMember).toHaveBeenCalledWith('channel-1', 'user-1');
        expect(mockGetMessagesUseCase.execute).toHaveBeenCalledWith({
            channelId: 'channel-1',
            limit: 20,
            before: undefined,
        });
        expect(result).toEqual({ success: true, data: [message.toPublic()] });
    });

    it('핀 변경 전에 메시지 접근 권한을 확인하고 소켓 이벤트를 보낸다', async () => {
        const message = makeMessage('message-1');
        mockPinMessageUseCase.execute.mockResolvedValue(message);

        const result = await controller.pinMessage('channel-1', 'message-1', { userId: 'user-1' }, { isPinned: true } as any);

        expect(mockMessageAccessService.ensureMessageInChannel).toHaveBeenCalledWith('channel-1', 'message-1', 'user-1');
        expect(mockPinMessageUseCase.execute).toHaveBeenCalledWith('message-1', true);
        expect(mockMessageGateway.emitPinnedUpdated).toHaveBeenCalledWith('channel-1', message.toPublic());
        expect(result).toEqual({ success: true, data: message.toPublic() });
    });

    it('스레드 조회 전에 부모 메시지 접근 권한을 확인한다', async () => {
        const reply = makeMessage('reply-1');
        mockGetThreadMessagesUseCase.execute.mockResolvedValue([reply]);

        const result = await controller.getThreadMessages('channel-1', 'message-1', { userId: 'user-1' });

        expect(mockMessageAccessService.ensureMessageInChannel).toHaveBeenCalledWith('channel-1', 'message-1', 'user-1');
        expect(mockGetThreadMessagesUseCase.execute).toHaveBeenCalledWith('message-1');
        expect(result).toEqual({ success: true, data: [reply.toPublic()] });
    });
});
