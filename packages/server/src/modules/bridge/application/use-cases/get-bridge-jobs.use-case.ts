import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BRIDGE_JOB_REPOSITORY, type IBridgeJobRepository } from '../../domain/bridge-job.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import type { BridgeEventType, BridgeJobStatus, BridgePlatform } from '../../domain/bridge-job.entity';

interface GetBridgeJobsOptions {
    limit?: number;
    status?: string;
    platform?: string;
    eventType?: string;
}

@Injectable()
export class GetBridgeJobsUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(BRIDGE_JOB_REPOSITORY) private readonly bridgeJobRepo: IBridgeJobRepository,
    ) {}

    async execute(teamId: string, actorId: string, options: GetBridgeJobsOptions = {}) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(actorId)) throw new BadRequestException('브리지 relay 이력을 조회할 권한이 없습니다.');

        return this.bridgeJobRepo.listRecent(teamId, {
            limit: normalizeLimit(options.limit ?? 12),
            status: normalizeStatus(options.status),
            platform: normalizePlatform(options.platform),
            eventType: normalizeEventType(options.eventType),
        });
    }
}

function normalizeLimit(limit: number) {
    if (!Number.isFinite(limit)) return 12;
    return Math.min(Math.max(Math.trunc(limit), 1), 30);
}

function normalizeStatus(value?: string): BridgeJobStatus | undefined {
    if (!value) return undefined;
    return ['pending', 'processing', 'sent', 'failed'].includes(value) ? (value as BridgeJobStatus) : undefined;
}

function normalizePlatform(value?: string): BridgePlatform | undefined {
    if (!value) return undefined;
    return ['slack', 'discord'].includes(value) ? (value as BridgePlatform) : undefined;
}

function normalizeEventType(value?: string): BridgeEventType | undefined {
    if (!value) return undefined;
    return ['announcement', 'github'].includes(value) ? (value as BridgeEventType) : undefined;
}
