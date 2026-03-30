import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './infrastructure/persistence/notification.schema';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NOTIFICATION_REPOSITORY } from './domain/notification.port';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case';
import { GetUnreadNotificationCountUseCase } from './application/use-cases/get-unread-notification-count.use-case';
import { MarkNotificationAsReadUseCase } from './application/use-cases/mark-notification-as-read.use-case';
import { MarkAllNotificationsAsReadUseCase } from './application/use-cases/mark-all-notifications-as-read.use-case';
import { NotificationController } from './infrastructure/http/notification.controller';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
import { NotificationGateway } from './infrastructure/websocket/notification.gateway';
import { NotificationAccessService } from './application/services/notification-access.service';

@Module({
    imports: [AuthModule, TeamModule, MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])],
    controllers: [NotificationController],
    providers: [
        { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepository },
        CreateNotificationUseCase,
        GetNotificationsUseCase,
        GetUnreadNotificationCountUseCase,
        MarkNotificationAsReadUseCase,
        MarkAllNotificationsAsReadUseCase,
        NotificationAccessService,
        NotificationGateway,
    ],
    exports: [CreateNotificationUseCase],
})
export class NotificationModule {}
