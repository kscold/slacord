import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamModule } from '../team/team.module';
import { Announcement, AnnouncementSchema } from './infrastructure/persistence/announcement.schema';
import { AnnouncementRepository } from './infrastructure/persistence/announcement.repository';
import { ANNOUNCEMENT_REPOSITORY } from './domain/announcement.port';
import { CreateAnnouncementUseCase } from './application/use-cases/create-announcement.use-case';
import { GetAnnouncementsUseCase } from './application/use-cases/get-announcements.use-case';
import { PinAnnouncementUseCase } from './application/use-cases/pin-announcement.use-case';
import { AnnouncementController } from './infrastructure/http/announcement.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Announcement.name, schema: AnnouncementSchema }]), TeamModule],
    controllers: [AnnouncementController],
    providers: [
        { provide: ANNOUNCEMENT_REPOSITORY, useClass: AnnouncementRepository },
        CreateAnnouncementUseCase,
        GetAnnouncementsUseCase,
        PinAnnouncementUseCase,
    ],
})
export class AnnouncementModule {}
