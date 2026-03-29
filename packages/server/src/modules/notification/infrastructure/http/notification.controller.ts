import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import type { INotificationRepository } from '../../domain/notification.port';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification.port';

@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/notification')
export class NotificationController {
    constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository) {}

    @Get()
    @ApiOperation({ summary: '내 알림 목록 (최근 50개)' })
    async getNotifications(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        const notifications = await this.repo.findByRecipient(teamId, user.userId, 50);
        return { success: true, data: notifications.map((n) => n.toPublic()) };
    }

    @Get('unread-count')
    @ApiOperation({ summary: '읽지 않은 알림 수' })
    async getUnreadCount(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        const count = await this.repo.countUnread(teamId, user.userId);
        return { success: true, data: { count } };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: '알림 읽음 처리' })
    async markAsRead(@Param('id') id: string) {
        await this.repo.markAsRead(id);
        return { success: true };
    }

    @Patch('read-all')
    @ApiOperation({ summary: '전체 읽음 처리' })
    async markAllAsRead(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        await this.repo.markAllAsRead(teamId, user.userId);
        return { success: true };
    }
}
