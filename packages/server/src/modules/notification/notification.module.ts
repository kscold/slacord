import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './infrastructure/persistence/notification.schema';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NOTIFICATION_REPOSITORY } from './domain/notification.port';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { NotificationController } from './infrastructure/http/notification.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])],
    controllers: [NotificationController],
    providers: [
        { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepository },
        CreateNotificationUseCase,
    ],
    exports: [CreateNotificationUseCase],
})
export class NotificationModule {}
