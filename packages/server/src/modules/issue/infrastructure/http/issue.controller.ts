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
    ) {}

    @Get()
    @ApiOperation({ summary: '팀 이슈 목록 조회 (status 필터 가능)' })
    @ApiQuery({ name: 'status', required: false, enum: ['todo', 'in_progress', 'in_review', 'done'] })
    async getIssues(@Param('teamId') teamId: string, @Query('status') status?: string) {
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
        const issue = await this.createIssueUseCase.execute({ ...dto, teamId, createdBy: user.userId });
        return { success: true, data: issue.toPublic() };
    }

    @Patch(':issueId')
    @ApiOperation({ summary: '이슈 수정 (상태 이동 포함)' })
    async updateIssue(@Param('issueId') issueId: string, @Body() dto: UpdateIssueDto) {
        const issue = await this.updateIssueUseCase.execute({ id: issueId, ...dto });
        return { success: true, data: issue.toPublic() };
    }

    @Delete(':issueId')
    @ApiOperation({ summary: '이슈 삭제' })
    async deleteIssue(@Param('issueId') issueId: string) {
        await this.deleteIssueUseCase.execute(issueId);
        return { success: true };
    }
}
