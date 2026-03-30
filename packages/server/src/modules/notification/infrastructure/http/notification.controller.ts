import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications.use-case';
import { GetUnreadNotificationCountUseCase } from '../../application/use-cases/get-unread-notification-count.use-case';
import { MarkAllNotificationsAsReadUseCase } from '../../application/use-cases/mark-all-notifications-as-read.use-case';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/mark-notification-as-read.use-case';
import { NotificationAccessService } from '../../application/services/notification-access.service';

@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/notification')
export class NotificationController {
    constructor(
        private readonly accessService: NotificationAccessService,
        private readonly getNotificationsUseCase: GetNotificationsUseCase,
        private readonly getUnreadCountUseCase: GetUnreadNotificationCountUseCase,
        private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
        private readonly markAllAsReadUseCase: MarkAllNotificationsAsReadUseCase,
    ) {}

    @Get()
    @ApiOperation({ summary: '내 알림 목록 (최근 50개)' })
    async getNotifications(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        await this.accessService.ensureMember(teamId, user.userId);
        const notifications = await this.getNotificationsUseCase.execute(teamId, user.userId);
        return { success: true, data: notifications.map((n) => n.toPublic()) };
    }

    @Get('unread-count')
    @ApiOperation({ summary: '읽지 않은 알림 수' })
    async getUnreadCount(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        await this.accessService.ensureMember(teamId, user.userId);
        const count = await this.getUnreadCountUseCase.execute(teamId, user.userId);
        return { success: true, data: { count } };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: '알림 읽음 처리' })
    async markAsRead(
        @Param('teamId') teamId: string,
        @Param('id') id: string,
        @CurrentUser() user: { userId: string },
    ) {
        await this.accessService.ensureMember(teamId, user.userId);
        await this.markAsReadUseCase.execute(id, user.userId);
        return { success: true };
    }

    @Patch('read-all')
    @ApiOperation({ summary: '전체 읽음 처리' })
    async markAllAsRead(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        await this.accessService.ensureMember(teamId, user.userId);
        await this.markAllAsReadUseCase.execute(teamId, user.userId);
        return { success: true };
    }
}
