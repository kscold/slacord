import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { ReactMessageUseCase } from '../../application/use-cases/react-message.use-case';
import { Attachment } from '../../domain/message.entity';

interface SendMessagePayload {
    teamId: string;
    channelId: string;
    content?: string;
    attachments?: Attachment[];
    replyToId?: string;
}

interface ReactionPayload {
    messageId: string;
    channelId: string;
    emoji: string;
}

interface SocketUser {
    userId: string;
    email: string;
    username?: string;
}

/** 실시간 채팅 WebSocket Gateway */
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessageGateway.name);

    constructor(
        private readonly sendMessageUseCase: SendMessageUseCase,
        private readonly reactMessageUseCase: ReactMessageUseCase,
        private readonly jwtService: JwtService,
    ) {}

    handleConnection(client: Socket) {
        try {
            client.data.user = this.authenticate(client);
        } catch (error) {
            this.logger.warn(`Client rejected: ${client.id}`);
            client.emit('error', { message: 'Authentication required.' });
            client.disconnect();
            return;
        }
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /** 채널 입장 - Socket Room으로 채널 격리 */
    @SubscribeMessage('join_channel')
    handleJoinChannel(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
        client.join(`channel:${data.channelId}`);
        client.emit('joined_channel', { channelId: data.channelId });
    }

    /** 채널 퇴장 */
    @SubscribeMessage('leave_channel')
    handleLeaveChannel(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
        client.leave(`channel:${data.channelId}`);
    }

    /** 메시지 전송 - DB 저장 후 채널 전체에 브로드캐스트 */
    @SubscribeMessage('send_message')
    async handleSendMessage(@MessageBody() payload: SendMessagePayload, @ConnectedSocket() client: Socket) {
        try {
            const user = this.getUser(client);
            const message = await this.sendMessageUseCase.execute({
                ...payload,
                authorId: user.userId,
                authorName: user.username ?? null,
            });
            const data = message.toPublic();
            this.emitNewMessage(payload.channelId, data);
            return { success: true, data };
        } catch (error) {
            client.emit('error', { message: 'Failed to send message.' });
        }
    }

    /** 이모지 반응 토글 - DB 저장 후 채널 브로드캐스트 */
    @SubscribeMessage('add_reaction')
    async handleReaction(@MessageBody() payload: ReactionPayload, @ConnectedSocket() client: Socket) {
        try {
            const user = this.getUser(client);
            const message = await this.reactMessageUseCase.execute(payload.messageId, payload.emoji, user.userId);
            this.server.to(`channel:${payload.channelId}`).emit('reaction_updated', message.toPublic());
            return { success: true };
        } catch (error) {
            client.emit('error', { message: 'Failed to add reaction.' });
        }
    }

    /** 타이핑 표시 - DB 저장 없이 브로드캐스트만 */
    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() data: { channelId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        client.to(`channel:${data.channelId}`).emit('user_typing', {
            userId: user.userId,
            username: user.username ?? '동료',
        });
    }

    private authenticate(client: Socket): SocketUser {
        const token = this.extractToken(client);
        if (!token) {
            throw new UnauthorizedException('Missing token');
        }
        const payload = this.jwtService.verify(token) as {
            sub: string;
            email: string;
            username?: string;
        };
        return { userId: payload.sub, email: payload.email, username: payload.username };
    }

    private extractToken(client: Socket) {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken.trim()) {
            return authToken;
        }
        const authorization = client.handshake.headers.authorization;
        if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
            return authorization.slice(7);
        }
        const cookieHeader = client.handshake.headers.cookie;
        if (!cookieHeader) {
            return null;
        }
        return cookieHeader
            .split(';')
            .map((value) => value.trim())
            .find((value) => value.startsWith('access_token='))
            ?.slice('access_token='.length) ?? null;
    }

    private getUser(client: Socket): SocketUser {
        return client.data.user as SocketUser;
    }

    emitNewMessage(channelId: string, message: Record<string, unknown>) {
        this.server.to(`channel:${channelId}`).emit('new_message', message);
    }

    emitPinnedUpdated(channelId: string, message: Record<string, unknown>) {
        this.server.to(`channel:${channelId}`).emit('pinned_message_updated', message);
    }
}
