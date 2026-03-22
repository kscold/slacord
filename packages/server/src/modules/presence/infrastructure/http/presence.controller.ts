import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PresenceService } from '../service/presence.service';

/** 팀원 온라인 상태 REST API */
@ApiTags('presence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/presence')
export class PresenceController {
    constructor(private readonly presenceService: PresenceService) {}

    @Get()
    @ApiOperation({ summary: '팀원 온라인 상태 전체 조회' })
    getAll(@Param('teamId') _teamId: string) {
        const presences = this.presenceService.getAll();
        return { success: true, data: presences.map((p) => p.toPublic()) };
    }
}
