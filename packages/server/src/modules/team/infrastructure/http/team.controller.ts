import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateTeamUseCase } from '../../application/use-cases/create-team.use-case';
import { GetTeamUseCase } from '../../application/use-cases/get-team.use-case';
import { GetTeamsUseCase } from '../../application/use-cases/get-teams.use-case';
import { GetTeamMembersUseCase } from '../../application/use-cases/get-team-members.use-case';
import { JoinTeamUseCase } from '../../application/use-cases/join-team.use-case';
import { UpdateGithubConfigUseCase } from '../../application/use-cases/update-github-config.use-case';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateGithubConfigDto } from './dto/update-github-config.dto';

/** 팀(워크스페이스) API */
@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
    constructor(
        private readonly createTeamUseCase: CreateTeamUseCase,
        private readonly getTeamUseCase: GetTeamUseCase,
        private readonly getTeamsUseCase: GetTeamsUseCase,
        private readonly getTeamMembersUseCase: GetTeamMembersUseCase,
        private readonly joinTeamUseCase: JoinTeamUseCase,
        private readonly updateGithubConfigUseCase: UpdateGithubConfigUseCase,
    ) {}

    @Get()
    @ApiOperation({ summary: '내 팀 목록 조회' })
    async getMyTeams(@CurrentUser() user: { userId: string }) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const teams = await this.getTeamsUseCase.execute(user.userId);
        return { success: true, data: teams.map((t) => t.toPublic()) };
    }

    @Get(':teamId')
    @ApiOperation({ summary: '팀 상세 조회' })
    async getTeam(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const team = await this.getTeamUseCase.execute(teamId, user.userId);
        return { success: true, data: team.toPublic() };
    }

    @Get(':teamId/member')
    @ApiOperation({ summary: '팀 멤버 목록 조회' })
    async getMembers(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        return { success: true, data: await this.getTeamMembersUseCase.execute(teamId, user.userId) };
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

    @Patch(':teamId/github')
    @ApiOperation({ summary: 'GitHub Webhook 설정 (repoUrl, webhookSecret, notifyChannelId)' })
    async updateGithubConfig(
        @Param('teamId') teamId: string,
        @Body() dto: UpdateGithubConfigDto,
    ) {
        const team = await this.updateGithubConfigUseCase.execute(teamId, dto);
        return { success: true, data: team.toPublic() };
    }
}
