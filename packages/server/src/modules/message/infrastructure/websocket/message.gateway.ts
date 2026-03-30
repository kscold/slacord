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
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { ReactMessageUseCase } from '../../application/use-cases/react-message.use-case';
import { Attachment } from '../../domain/message.entity';
import { authenticateSocketUser, type SocketUser } from '../../../../shared/lib/socket-auth';

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
            client.data.user = authenticateSocketUser(this.jwtService, client);
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
            this.logger.error('Failed to send message', error instanceof Error ? error.stack : error);
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
            this.logger.error('Failed to add reaction', error instanceof Error ? error.stack : error);
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

    private getUser(client: Socket): SocketUser {
        return client.data.user as SocketUser;
    }

    emitNewMessage(channelId: string, message: Record<string, unknown>) {
        this.server.to(`channel:${channelId}`).emit('new_message', message);
    }

    emitMessageDeleted(channelId: string, messageId: string) {
        this.server.to(`channel:${channelId}`).emit('message_deleted', { messageId });
    }

    emitPinnedUpdated(channelId: string, message: Record<string, unknown>) {
        this.server.to(`channel:${channelId}`).emit('pinned_message_updated', message);
    }

    // ─── 허들(음성/영상 통화) 시그널링 ───

    /** 허들 참여자 목록 (channelId → Set<{userId, audio, video}>) */
    private huddleRooms = new Map<string, Map<string, { audio: boolean; video: boolean }>>();

    @SubscribeMessage('huddle:join')
    handleHuddleJoin(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
        const user = this.getUser(client);
        const roomKey = `huddle:${data.channelId}`;
        client.join(roomKey);

        if (!this.huddleRooms.has(data.channelId)) {
            this.huddleRooms.set(data.channelId, new Map());
        }
        this.huddleRooms.get(data.channelId)!.set(user.userId, { audio: true, video: false });

        // 기존 참여자들에게 새 유저 알림
        client.to(roomKey).emit('huddle:user-joined', { channelId: data.channelId, userId: user.userId });

        // 참여자 목록 전체 브로드캐스트
        this.broadcastHuddleParticipants(data.channelId);
    }

    @SubscribeMessage('huddle:leave')
    handleHuddleLeave(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
        const user = this.getUser(client);
        const roomKey = `huddle:${data.channelId}`;
        client.leave(roomKey);

        this.huddleRooms.get(data.channelId)?.delete(user.userId);
        if (this.huddleRooms.get(data.channelId)?.size === 0) {
            this.huddleRooms.delete(data.channelId);
        }

        this.server.to(roomKey).emit('huddle:user-left', { userId: user.userId });
        this.broadcastHuddleParticipants(data.channelId);
    }

    @SubscribeMessage('huddle:offer')
    handleHuddleOffer(
        @MessageBody() data: { channelId: string; targetUserId: string; offer: RTCSessionDescriptionInit },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        // targetUserId의 소켓을 찾아서 offer 전달
        const roomKey = `huddle:${data.channelId}`;
        client.to(roomKey).emit('huddle:offer', {
            channelId: data.channelId,
            fromUserId: user.userId,
            offer: data.offer,
        });
    }

    @SubscribeMessage('huddle:answer')
    handleHuddleAnswer(
        @MessageBody() data: { channelId: string; targetUserId: string; answer: RTCSessionDescriptionInit },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        const roomKey = `huddle:${data.channelId}`;
        client.to(roomKey).emit('huddle:answer', {
            fromUserId: user.userId,
            answer: data.answer,
        });
    }

    @SubscribeMessage('huddle:ice-candidate')
    handleHuddleIceCandidate(
        @MessageBody() data: { channelId: string; targetUserId: string; candidate: RTCIceCandidateInit },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        const roomKey = `huddle:${data.channelId}`;
        client.to(roomKey).emit('huddle:ice-candidate', {
            fromUserId: user.userId,
            candidate: data.candidate,
        });
    }

    @SubscribeMessage('huddle:toggle-media')
    handleHuddleToggleMedia(
        @MessageBody() data: { channelId: string; audio: boolean; video: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        this.huddleRooms.get(data.channelId)?.set(user.userId, { audio: data.audio, video: data.video });
        this.broadcastHuddleParticipants(data.channelId);
    }

    private broadcastHuddleParticipants(channelId: string) {
        const room = this.huddleRooms.get(channelId);
        const participants = room
            ? [...room.entries()].map(([userId, media]) => ({ userId, ...media }))
            : [];
        this.server.to(`huddle:${channelId}`).emit('huddle:participants', { channelId, participants });
    }
}
