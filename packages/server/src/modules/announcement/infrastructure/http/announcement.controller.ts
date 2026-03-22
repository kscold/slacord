import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateAnnouncementUseCase } from '../../application/use-cases/create-announcement.use-case';
import { GetAnnouncementsUseCase } from '../../application/use-cases/get-announcements.use-case';
import { PinAnnouncementUseCase } from '../../application/use-cases/pin-announcement.use-case';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { PinAnnouncementDto } from './dto/pin-announcement.dto';

/** 공지사항 API */
@ApiTags('announcement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/announcement')
export class AnnouncementController {
    constructor(
        private readonly createUseCase: CreateAnnouncementUseCase,
        private readonly getUseCase: GetAnnouncementsUseCase,
        private readonly pinUseCase: PinAnnouncementUseCase,
    ) {}

    @Get()
    @ApiOperation({ summary: '팀 공지사항 목록 조회 (핀 고정 우선)' })
    async getAnnouncements(@Param('teamId') teamId: string) {
        const list = await this.getUseCase.execute(teamId);
        return { success: true, data: list.map((a) => a.toPublic()) };
    }

    @Post()
    @ApiOperation({ summary: '공지사항 생성' })
    async createAnnouncement(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateAnnouncementDto,
    ) {
        const announcement = await this.createUseCase.execute({ ...dto, teamId, createdBy: user.userId });
        return { success: true, data: announcement.toPublic() };
    }

    @Patch(':announcementId/pin')
    @ApiOperation({ summary: '공지사항 핀 고정/해제' })
    async pinAnnouncement(
        @Param('announcementId') announcementId: string,
        @Body() dto: PinAnnouncementDto,
    ) {
        const announcement = await this.pinUseCase.execute(announcementId, dto.isPinned);
        return { success: true, data: announcement.toPublic() };
    }
}
