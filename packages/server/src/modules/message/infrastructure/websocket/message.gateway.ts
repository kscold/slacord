import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';

interface SendMessagePayload {
    teamId: string;
    channelId: string;
    authorId: string;
    content: string;
    replyToId?: string;
}

/** 실시간 채팅 WebSocket Gateway */
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessageGateway.name);

    constructor(private readonly sendMessageUseCase: SendMessageUseCase) {}

    handleConnection(client: Socket) {
        this.logger.log(`클라이언트 연결: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`클라이언트 연결 해제: ${client.id}`);
    }

    /** 채널 입장 - Socket Room으로 채널 격리 */
    @SubscribeMessage('join_channel')
    handleJoinChannel(
        @MessageBody() data: { channelId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`channel:${data.channelId}`);
        client.emit('joined_channel', { channelId: data.channelId });
    }

    /** 채널 퇴장 */
    @SubscribeMessage('leave_channel')
    handleLeaveChannel(
        @MessageBody() data: { channelId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`channel:${data.channelId}`);
    }

    /** 메시지 전송 - DB 저장 후 채널 전체에 브로드캐스트 */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() payload: SendMessagePayload,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const message = await this.sendMessageUseCase.execute(payload);
            const data = message.toPublic();
            this.server.to(`channel:${payload.channelId}`).emit('new_message', data);
            return { success: true, data };
        } catch (error) {
            client.emit('error', { message: '메시지 전송에 실패했습니다.' });
        }
    }

    /** 타이핑 표시 - DB 저장 없이 브로드캐스트만 */
    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() data: { channelId: string; userId: string; username: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(`channel:${data.channelId}`).emit('user_typing', {
            userId: data.userId,
            username: data.username,
        });
    }
}
