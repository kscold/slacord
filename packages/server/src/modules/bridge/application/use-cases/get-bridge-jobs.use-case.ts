import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BRIDGE_JOB_REPOSITORY, type IBridgeJobRepository } from '../../domain/bridge-job.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';

@Injectable()
export class GetBridgeJobsUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(BRIDGE_JOB_REPOSITORY) private readonly bridgeJobRepo: IBridgeJobRepository,
    ) {}

    async execute(teamId: string, actorId: string, limit = 12) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(actorId)) throw new BadRequestException('브리지 relay 이력을 조회할 권한이 없습니다.');

        const normalizedLimit = normalizeLimit(limit);
        return this.bridgeJobRepo.listRecent(teamId, normalizedLimit);
    }
}

function normalizeLimit(limit: number) {
    if (!Number.isFinite(limit)) return 12;
    return Math.min(Math.max(Math.trunc(limit), 1), 30);
}
