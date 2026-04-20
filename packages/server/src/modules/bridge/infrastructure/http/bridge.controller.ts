import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
        @Query('status') status?: string,
        @Query('platform') platform?: string,
        @Query('eventType') eventType?: string,
    ) {
        return this.getBridgeJobsUseCase.execute(teamId, user.userId, {
            limit: Number(limit ?? 12),
            status,
            platform,
            eventType,
        });
    }

    @Post('jobs/:jobId/retry')
    @ApiOperation({ summary: '실패한 외부 브리지 relay job 재시도' })
    async retryJob(
        @Param('teamId') teamId: string,
        @Param('jobId') jobId: string,
        @CurrentUser() user: { userId: string },
    ) {
        return this.retryBridgeJobUseCase.execute(teamId, user.userId, jobId);
    }
}
