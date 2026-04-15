import { BadRequestException, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { GetBridgeJobsUseCase } from '../../application/use-cases/get-bridge-jobs.use-case';
import { RetryBridgeJobUseCase } from '../../application/use-cases/retry-bridge-job.use-case';

@ApiTags('bridge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/bridge')
export class BridgeController {
    constructor(
        private readonly getBridgeJobsUseCase: GetBridgeJobsUseCase,
        private readonly retryBridgeJobUseCase: RetryBridgeJobUseCase,
    ) {}

    @Get('jobs')
    @ApiOperation({ summary: '최근 외부 브리지 relay job 조회' })
    async getRecentJobs(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Query('limit') limit?: string,
    ) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const jobs = await this.getBridgeJobsUseCase.execute(teamId, user.userId, Number(limit ?? 12));
        return { success: true, data: jobs.map((job) => job.toPublic()) };
    }

    @Post('jobs/:jobId/retry')
    @ApiOperation({ summary: '실패한 외부 브리지 relay job 재시도' })
    async retryJob(
        @Param('teamId') teamId: string,
        @Param('jobId') jobId: string,
        @CurrentUser() user: { userId: string },
    ) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const job = await this.retryBridgeJobUseCase.execute(teamId, user.userId, jobId);
        return { success: true, data: job.toPublic() };
    }
}
