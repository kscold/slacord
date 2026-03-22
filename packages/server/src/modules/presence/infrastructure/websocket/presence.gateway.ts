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
import { PresenceService } from '../service/presence.service';
import type { PresenceStatus } from '../../domain/presence.entity';

/** 팀원 온라인 상태 WebSocket Gateway (/presence namespace) */
@WebSocketGateway({ namespace: '/presence', cors: { origin: '*' } })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(PresenceGateway.name);

    constructor(private readonly presenceService: PresenceService) {}

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (!userId) return;

        this.logger.log(`Presence connected: userId=${userId}`);
        this.presenceService.setOnline(userId);
        this.server.emit('presence_update', { userId, status: 'online', lastSeen: new Date() });
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (!userId) return;

        this.logger.log(`Presence disconnected: userId=${userId}`);
        this.presenceService.setOffline(userId);
        this.server.emit('presence_update', { userId, status: 'offline', lastSeen: new Date() });
    }

    /** 클라이언트에서 직접 상태 변경 (away, do-not-disturb 등) */
    @SubscribeMessage('set_status')
    handleSetStatus(
        @MessageBody() data: { userId: string; status: PresenceStatus },
        @ConnectedSocket() _client: Socket,
    ) {
        this.presenceService.setStatus(data.userId, data.status);
        this.server.emit('presence_update', { userId: data.userId, status: data.status, lastSeen: new Date() });
    }
}
