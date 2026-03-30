import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateIssueUseCase } from '../../application/use-cases/create-issue.use-case';
import { UpdateIssueUseCase } from '../../application/use-cases/update-issue.use-case';
import { GetIssuesUseCase } from '../../application/use-cases/get-issues.use-case';
import { DeleteIssueUseCase } from '../../application/use-cases/delete-issue.use-case';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import type { IssueStatus } from '../../domain/issue.entity';
import { IssueAccessService } from '../../application/services/issue-access.service';
import { IssueNotificationService } from '../../application/services/issue-notification.service';

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
        private readonly issueAccessService: IssueAccessService,
        private readonly issueNotificationService: IssueNotificationService,
    ) {}

    @Get()
    @ApiOperation({ summary: '팀 이슈 목록 조회 (status 필터 가능)' })
    @ApiQuery({ name: 'status', required: false, enum: ['todo', 'in_progress', 'in_review', 'done'] })
    @ApiQuery({ name: 'q', required: false, type: String })
    @ApiQuery({ name: 'assigneeId', required: false, type: String })
    async getIssues(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Query('status') status?: string,
        @Query('q') query?: string,
        @Query('assigneeId') assigneeId?: string,
    ) {
        await this.issueAccessService.ensureMember(teamId, user.userId);
        const issues = await this.getIssuesUseCase.execute(teamId, {
            status: status as IssueStatus | undefined,
            query,
            assigneeId,
        });
        return { success: true, data: issues.map((i) => i.toPublic()) };
    }

    @Post()
    @ApiOperation({ summary: '이슈 생성' })
    async createIssue(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateIssueDto,
    ) {
        await this.issueAccessService.ensureMember(teamId, user.userId);
        const issue = await this.createIssueUseCase.execute({ ...dto, teamId, createdBy: user.userId });
        void this.issueNotificationService.notifyAssignees({
            teamId,
            actorId: user.userId,
            assigneeIds: dto.assigneeIds,
            issueId: issue.id,
            issueTitle: issue.title,
        });
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
        await this.issueAccessService.ensureMember(teamId, user.userId);
        const issue = await this.updateIssueUseCase.execute({ id: issueId, ...dto });
        void this.issueNotificationService.notifyAssignees({
            teamId,
            actorId: user.userId,
            assigneeIds: dto.assigneeIds,
            issueId: issue.id,
            issueTitle: issue.title,
        });
        return { success: true, data: issue.toPublic() };
    }

    @Delete(':issueId')
    @ApiOperation({ summary: '이슈 삭제' })
    async deleteIssue(
        @Param('teamId') teamId: string,
        @Param('issueId') issueId: string,
        @CurrentUser() user: { userId: string },
    ) {
        await this.issueAccessService.ensureMember(teamId, user.userId);
        await this.deleteIssueUseCase.execute(issueId);
        return { success: true };
    }
}
