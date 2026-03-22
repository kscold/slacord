import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateTeamUseCase } from '../../application/use-cases/create-team.use-case';
import { GetTeamsUseCase } from '../../application/use-cases/get-teams.use-case';
import { JoinTeamUseCase } from '../../application/use-cases/join-team.use-case';

class CreateTeamDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsString()
    @Matches(/^[a-z0-9-]+$/, { message: '슬러그는 소문자, 숫자, 하이픈만 허용됩니다.' })
    slug: string;

    @IsOptional()
    @IsString()
    description?: string;
}

/** 팀(워크스페이스) API */
@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
    constructor(
        private readonly createTeamUseCase: CreateTeamUseCase,
        private readonly getTeamsUseCase: GetTeamsUseCase,
        private readonly joinTeamUseCase: JoinTeamUseCase,
    ) {}

    @Get()
    @ApiOperation({ summary: '내 팀 목록 조회' })
    async getMyTeams(@CurrentUser() user: { userId: string }) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const teams = await this.getTeamsUseCase.execute(user.userId);
        return { success: true, data: teams.map((t) => t.toPublic()) };
    }

    @Post()
    @ApiOperation({ summary: '팀 생성' })
    async createTeam(@CurrentUser() user: { userId: string }, @Body() dto: CreateTeamDto) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const team = await this.createTeamUseCase.execute({ ...dto, ownerId: user.userId });
        return { success: true, data: team.toPublic() };
    }

    @Post(':slug/join')
    @ApiOperation({ summary: '팀 참여 (슬러그로)' })
    async joinTeam(@CurrentUser() user: { userId: string }, @Param('slug') slug: string) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const team = await this.joinTeamUseCase.execute({ slug, userId: user.userId });
        return { success: true, data: team.toPublic() };
    }
}
