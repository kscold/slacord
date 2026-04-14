import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { PresenceAccessService } from '../../application/services/presence-access.service';
import { PresenceService } from '../service/presence.service';

/** 팀원 온라인 상태 REST API */
@ApiTags('presence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/presence')
export class PresenceController {
    constructor(
        private readonly presenceService: PresenceService,
        private readonly presenceAccessService: PresenceAccessService,
    ) {}

    @Get()
    @ApiOperation({ summary: '팀원 온라인 상태 전체 조회' })
    async getAll(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        await this.presenceAccessService.ensureMember(teamId, user.userId);
        const presences = this.presenceService.getAll();
        return { success: true, data: presences.map((p) => p.toPublic()) };
    }
}
