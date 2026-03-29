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
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PresenceService } from '../service/presence.service';
import type { PresenceStatus } from '../../domain/presence.entity';

interface SocketUser {
    userId: string;
    email: string;
    username?: string;
}

/** 팀원 온라인 상태 WebSocket Gateway (/presence namespace) */
@WebSocketGateway({ namespace: '/presence', cors: { origin: '*' } })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(PresenceGateway.name);

    constructor(
        private readonly presenceService: PresenceService,
        private readonly jwtService: JwtService,
    ) {}

    handleConnection(client: Socket) {
        try {
            client.data.user = this.authenticate(client);
        } catch {
            this.logger.warn(`Presence client rejected: ${client.id}`);
            client.emit('error', { message: 'Authentication required.' });
            client.disconnect();
            return;
        }
        const user = client.data.user as SocketUser;
        this.logger.log(`Presence connected: userId=${user.userId}`);
        this.presenceService.setOnline(user.userId);
        this.server.emit('presence_update', { userId: user.userId, status: 'online', lastSeen: new Date() });
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user as SocketUser | undefined;
        if (!user) return;

        this.logger.log(`Presence disconnected: userId=${user.userId}`);
        this.presenceService.setOffline(user.userId);
        this.server.emit('presence_update', { userId: user.userId, status: 'offline', lastSeen: new Date() });
    }

    /** 클라이언트에서 직접 상태 변경 (away, do-not-disturb 등) */
    @SubscribeMessage('set_status')
    handleSetStatus(
        @MessageBody() data: { status: PresenceStatus },
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user as SocketUser;
        this.presenceService.setStatus(user.userId, data.status);
        this.server.emit('presence_update', { userId: user.userId, status: data.status, lastSeen: new Date() });
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
}
