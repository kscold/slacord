import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { ReactMessageUseCase } from '../../application/use-cases/react-message.use-case';
import { MessageAccessService } from '../../application/services/message-access.service';
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
        private readonly messageAccessService: MessageAccessService,
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
        const user = this.getUser(client);
        client.join(this.getUserRoomKey(user.userId));
        this.logger.log(`Client connected: ${client.id} userId=${user.userId}`);
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user as SocketUser | undefined;
        if (user) {
            for (const [channelId, participants] of this.huddleRooms.entries()) {
                if (!participants.delete(user.userId)) continue;
                if (participants.size === 0) {
                    this.huddleRooms.delete(channelId);
                }
                this.server.to(`huddle:${channelId}`).emit('huddle:user-left', { userId: user.userId });
                this.broadcastHuddleParticipants(channelId);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /** 채널 입장 - Socket Room으로 채널 격리 */
    @SubscribeMessage('join_channel')
    async handleJoinChannel(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
        try {
            const user = this.getUser(client);
            await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            client.join(`channel:${data.channelId}`);
            client.emit('joined_channel', { channelId: data.channelId });
        } catch (error) {
            this.emitSocketError(client, error, '채널에 참여할 수 없습니다.');
        }
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
            const { channel } = await this.messageAccessService.ensureChannelMember(payload.channelId, user.userId);
            const message = await this.sendMessageUseCase.execute({
                ...payload,
                teamId: channel.teamId,
                channelId: channel.id,
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
            await this.messageAccessService.ensureMessageInChannel(payload.channelId, payload.messageId, user.userId);
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
    async handleTyping(
        @MessageBody() data: { channelId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = this.getUser(client);
            await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            client.to(`channel:${data.channelId}`).emit('user_typing', {
                userId: user.userId,
                username: user.username ?? '동료',
            });
        } catch (error) {
            this.emitSocketError(client, error, '타이핑 상태를 전송할 수 없습니다.');
        }
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
    async handleHuddleJoin(@MessageBody() data: { channelId: string }, @ConnectedSocket() client: Socket) {
        try {
            const user = this.getUser(client);
            const { channel } = await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            const roomKey = `huddle:${channel.id}`;
            client.join(roomKey);

            if (!this.huddleRooms.has(channel.id)) {
                this.huddleRooms.set(channel.id, new Map());
            }
            this.huddleRooms.get(channel.id)!.set(user.userId, { audio: true, video: false });

            client.to(roomKey).emit('huddle:user-joined', { channelId: channel.id, userId: user.userId });
            this.broadcastHuddleParticipants(channel.id);
        } catch (error) {
            this.emitSocketError(client, error, '허들에 참여할 수 없습니다.');
        }
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
    async handleHuddleOffer(
        @MessageBody() data: { channelId: string; targetUserId: string; offer: RTCSessionDescriptionInit },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = this.getUser(client);
            const { channel } = await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            this.ensureHuddleParticipant(channel.id, user.userId);
            this.ensureHuddleParticipant(channel.id, data.targetUserId);
            this.server.to(this.getUserRoomKey(data.targetUserId)).emit('huddle:offer', {
                channelId: channel.id,
                fromUserId: user.userId,
                offer: data.offer,
            });
        } catch (error) {
            this.emitSocketError(client, error, '허들 연결 요청을 전달할 수 없습니다.');
        }
    }

    @SubscribeMessage('huddle:answer')
    async handleHuddleAnswer(
        @MessageBody() data: { channelId: string; targetUserId: string; answer: RTCSessionDescriptionInit },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = this.getUser(client);
            const { channel } = await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            this.ensureHuddleParticipant(channel.id, user.userId);
            this.ensureHuddleParticipant(channel.id, data.targetUserId);
            this.server.to(this.getUserRoomKey(data.targetUserId)).emit('huddle:answer', {
                channelId: channel.id,
                fromUserId: user.userId,
                answer: data.answer,
            });
        } catch (error) {
            this.emitSocketError(client, error, '허들 응답을 전달할 수 없습니다.');
        }
    }

    @SubscribeMessage('huddle:ice-candidate')
    async handleHuddleIceCandidate(
        @MessageBody() data: { channelId: string; targetUserId: string; candidate: RTCIceCandidateInit },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = this.getUser(client);
            const { channel } = await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            this.ensureHuddleParticipant(channel.id, user.userId);
            this.ensureHuddleParticipant(channel.id, data.targetUserId);
            this.server.to(this.getUserRoomKey(data.targetUserId)).emit('huddle:ice-candidate', {
                channelId: channel.id,
                fromUserId: user.userId,
                candidate: data.candidate,
            });
        } catch (error) {
            this.emitSocketError(client, error, '허들 네트워크 정보를 전달할 수 없습니다.');
        }
    }

    @SubscribeMessage('huddle:toggle-media')
    async handleHuddleToggleMedia(
        @MessageBody() data: { channelId: string; audio: boolean; video: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = this.getUser(client);
            const { channel } = await this.messageAccessService.ensureChannelMember(data.channelId, user.userId);
            this.ensureHuddleParticipant(channel.id, user.userId);
            this.huddleRooms.get(channel.id)?.set(user.userId, { audio: data.audio, video: data.video });
            this.broadcastHuddleParticipants(channel.id);
        } catch (error) {
            this.emitSocketError(client, error, '허들 미디어 상태를 변경할 수 없습니다.');
        }
    }

    private broadcastHuddleParticipants(channelId: string) {
        const room = this.huddleRooms.get(channelId);
        const participants = room
            ? [...room.entries()].map(([userId, media]) => ({ userId, ...media }))
            : [];
        this.server.to(`huddle:${channelId}`).emit('huddle:participants', { channelId, participants });
    }

    private ensureHuddleParticipant(channelId: string, userId: string) {
        if (!this.huddleRooms.get(channelId)?.has(userId)) {
            throw new BadRequestException('허들 참여자를 찾을 수 없습니다.');
        }
    }

    private getUserRoomKey(userId: string) {
        return `user:${userId}`;
    }

    private emitSocketError(client: Socket, error: unknown, fallbackMessage: string) {
        const message = error instanceof Error ? error.message : fallbackMessage;
        this.logger.warn(message);
        client.emit('error', { message });
        if (error instanceof WsException) {
            throw error;
        }
    }
}
