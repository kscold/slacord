import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import type { TeamAuditLogCategory } from '../../domain/team.entity';

interface GetTeamAuditLogsOptions {
    category?: string;
    limit?: number;
}

@Injectable()
export class GetTeamAuditLogsUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, actorId: string, options: GetTeamAuditLogsOptions = {}) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(actorId)) throw new BadRequestException('운영 감사 로그를 조회할 권한이 없습니다.');

        const category = normalizeCategory(options.category);
        const limit = normalizeLimit(options.limit);

        return team.auditLogs
            .filter((auditLog) => !category || auditLog.category === category)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
            .slice(0, limit);
    }
}

function normalizeCategory(value?: string): TeamAuditLogCategory | undefined {
    if (!value) return undefined;
    return ['delivery', 'access', 'bridge'].includes(value) ? (value as TeamAuditLogCategory) : undefined;
}

function normalizeLimit(value?: number) {
    if (!Number.isFinite(value)) return 20;
    return Math.min(Math.max(Math.trunc(value ?? 20), 1), 60);
}
