import { Body, Controller, Delete, ForbiddenException, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateIssueUseCase } from '../../application/use-cases/create-issue.use-case';
import { UpdateIssueUseCase } from '../../application/use-cases/update-issue.use-case';
import { GetIssuesUseCase } from '../../application/use-cases/get-issues.use-case';
import { DeleteIssueUseCase } from '../../application/use-cases/delete-issue.use-case';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import type { IssueStatus } from '../../domain/issue.entity';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

/** 이슈 트래커 API */
@ApiTags('issue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/issue')
export class IssueController {
    constructor(
        private readonly createIssueUseCase: CreateIssueUseCase,
        private readonly updateIssueUseCase: UpdateIssueUseCase,
        private readonly getIssuesUseCase: GetIssuesUseCase,
        private readonly deleteIssueUseCase: DeleteIssueUseCase,
        private readonly createNotification: CreateNotificationUseCase,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    private async requireMember(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new ForbiddenException('워크스페이스를 찾을 수 없습니다.');
        const member = team.members.find((m) => m.userId === userId);
        if (!member) throw new ForbiddenException('이 워크스페이스의 멤버가 아닙니다.');
        return member.role;
    }

    @Get()
    @ApiOperation({ summary: '팀 이슈 목록 조회 (status 필터 가능)' })
    @ApiQuery({ name: 'status', required: false, enum: ['todo', 'in_progress', 'in_review', 'done'] })
    async getIssues(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }, @Query('status') status?: string) {
        await this.requireMember(teamId, user.userId);
        const issues = await this.getIssuesUseCase.execute(teamId, status as IssueStatus | undefined);
        return { success: true, data: issues.map((i) => i.toPublic()) };
    }

    @Post()
    @ApiOperation({ summary: '이슈 생성' })
    async createIssue(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateIssueDto,
    ) {
        await this.requireMember(teamId, user.userId);
        const issue = await this.createIssueUseCase.execute({ ...dto, teamId, createdBy: user.userId });
        // 담당자 할당 알림
        if (dto.assigneeIds?.length) {
            void this.createNotification.executeBulk(
                dto.assigneeIds.map((recipientId) => ({
                    teamId, recipientId, type: 'issue_assigned' as const,
                    actorId: user.userId, actorName: '', content: `이슈 "${issue.title}" 담당자로 지정됨`,
                    resourceType: 'issue' as const, resourceId: issue.id,
                })),
            );
        }
        return { success: true, data: issue.toPublic() };
    }

    @Patch(':issueId')
    @ApiOperation({ summary: '이슈 수정 (상태 이동 포함)' })
    async updateIssue(
        @Param('teamId') teamId: string,
        @Param('issueId') issueId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: UpdateIssueDto,
    ) {
        await this.requireMember(teamId, user.userId);
        const issue = await this.updateIssueUseCase.execute({ id: issueId, ...dto });
        // 새로 할당된 담당자에게 알림
        if (dto.assigneeIds?.length) {
            void this.createNotification.executeBulk(
                dto.assigneeIds.map((recipientId) => ({
                    teamId, recipientId, type: 'issue_assigned' as const,
                    actorId: user.userId, actorName: '', content: `이슈 "${issue.title}" 담당자로 지정됨`,
                    resourceType: 'issue' as const, resourceId: issue.id,
                })),
            );
        }
        return { success: true, data: issue.toPublic() };
    }

    @Delete(':issueId')
    @ApiOperation({ summary: '이슈 삭제' })
    async deleteIssue(
        @Param('teamId') teamId: string,
        @Param('issueId') issueId: string,
        @CurrentUser() user: { userId: string },
    ) {
        await this.requireMember(teamId, user.userId);
        await this.deleteIssueUseCase.execute(issueId);
        return { success: true };
    }
}
