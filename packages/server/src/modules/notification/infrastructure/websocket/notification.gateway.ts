import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import type { NotificationEntity } from '../../domain/notification.entity';
import { authenticateSocketUser, type SocketUser } from '../../../../shared/lib/socket-auth';

@WebSocketGateway({ namespace: '/notification', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    handleConnection(client: Socket) {
        try {
            client.data.user = authenticateSocketUser(this.jwtService, client);
        } catch {
            this.logger.warn(`Notification client rejected: ${client.id}`);
            client.emit('error', { message: 'Authentication required.' });
            client.disconnect();
            return;
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Notification client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_team_notifications')
    async handleJoinTeam(
        @MessageBody() data: { teamId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        const team = await this.teamRepo.findById(data.teamId);
        if (!team?.isMember(user.userId)) {
            throw new UnauthorizedException('워크스페이스 접근 권한이 없습니다.');
        }
        client.join(this.getRoomKey(data.teamId, user.userId));
        client.emit('joined_team_notifications', { teamId: data.teamId });
    }

    @SubscribeMessage('leave_team_notifications')
    handleLeaveTeam(
        @MessageBody() data: { teamId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.getUser(client);
        client.leave(this.getRoomKey(data.teamId, user.userId));
    }

    emitNotification(notification: NotificationEntity) {
        this.server
            .to(this.getRoomKey(notification.teamId, notification.recipientId))
            .emit('notification:new', notification.toPublic());
    }

    emitNotificationRead(teamId: string, userId: string, notificationId: string) {
        this.server
            .to(this.getRoomKey(teamId, userId))
            .emit('notification:read', { id: notificationId });
    }

    emitNotificationsReadAll(teamId: string, userId: string) {
        this.server
            .to(this.getRoomKey(teamId, userId))
            .emit('notification:read_all');
    }

    private getRoomKey(teamId: string, userId: string) {
        return `notification:${teamId}:${userId}`;
    }

    private getUser(client: Socket) {
        return client.data.user as SocketUser;
    }
}
