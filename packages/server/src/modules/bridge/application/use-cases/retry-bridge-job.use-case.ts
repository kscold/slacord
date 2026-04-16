import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BRIDGE_JOB_REPOSITORY, type IBridgeJobRepository } from '../../domain/bridge-job.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import { createTeamAuditLogEntry } from '../../../team/domain/team.entity';

@Injectable()
export class RetryBridgeJobUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(BRIDGE_JOB_REPOSITORY) private readonly bridgeJobRepo: IBridgeJobRepository,
    ) {}

    async execute(teamId: string, actorId: string, jobId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(actorId)) throw new BadRequestException('실패한 브리지 relay를 재시도할 권한이 없습니다.');

        const job = await this.bridgeJobRepo.findById(jobId);
        if (!job || job.teamId !== teamId) throw new BadRequestException('존재하지 않는 브리지 relay 이력입니다.');
        if (job.status !== 'failed') throw new BadRequestException('실패한 relay만 다시 시도할 수 있습니다.');

        const target = team.bridgeConfig[job.platform];
        const relayEnabled = job.eventType === 'announcement' ? target.relayAnnouncements : target.relayGithub;

        if (!target.enabled || !relayEnabled || !target.webhookUrl.trim()) {
            throw new BadRequestException('현재 브리지 설정으로는 이 relay를 다시 시도할 수 없습니다.');
        }

        const [retryJob] = await this.bridgeJobRepo.enqueueMany([
            {
                teamId,
                platform: job.platform,
                eventType: job.eventType,
                webhookUrl: target.webhookUrl.trim(),
                title: job.title,
                content: job.content,
                url: job.url,
            },
        ]);

        await this.teamRepo.appendAuditLog(teamId, createTeamAuditLogEntry({
            actorId,
            category: 'bridge',
            action: 'bridge_job_retried',
            summary: '실패한 브리지 relay를 다시 시도함',
            target: job.title,
            metadata: {
                originalJobId: job.id,
                retryJobId: retryJob.id,
                platform: job.platform,
                eventType: job.eventType,
            },
        }));

        return retryJob;
    }
}
