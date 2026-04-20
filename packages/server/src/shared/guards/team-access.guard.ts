import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TEAM_ROLE_KEY, type TeamAccessLevel } from '../decorators/team-role.decorator';
import type { TeamAccessContext } from '../decorators/team-access.decorator';
import { TeamAccessService } from '../../modules/team/application/services/team-access.service';

interface AuthenticatedRequest {
    user?: { userId?: string; sub?: string };
    params: Record<string, string>;
    teamAccess?: TeamAccessContext;
}

/**
 * `@TeamRole('member'|'writable'|'admin'|'owner')` 메타데이터를 읽고
 * TeamAccessService로 권한 검사를 수행하는 가드.
 *
 * 검사 통과 시 해결된 TeamAccess를 req.teamAccess에 주입하여
 * `@TeamAccess()` 파라미터 데코레이터로 접근할 수 있게 한다.
 *
 * `teamId`는 라우트 파라미터에서 추출한다 (:teamId).
 */
@Injectable()
export class TeamAccessGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly teamAccessService: TeamAccessService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const level = this.reflector.getAllAndOverride<TeamAccessLevel | undefined>(TEAM_ROLE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!level) return true;

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const userId = request.user?.userId ?? request.user?.sub;
        if (!userId) {
            throw new UnauthorizedException('인증이 필요합니다.');
        }

        const teamId = request.params?.teamId;
        if (!teamId) {
            throw new ForbiddenException('teamId 파라미터가 필요합니다.');
        }

        const access = await this.resolveAccess(level, teamId, userId);
        request.teamAccess = access;
        return true;
    }

    private resolveAccess(level: TeamAccessLevel, teamId: string, userId: string): Promise<TeamAccessContext> {
        switch (level) {
            case 'owner':
                return this.teamAccessService.requireOwner(teamId, userId);
            case 'admin':
                return this.teamAccessService.requireAdmin(teamId, userId);
            case 'writable':
                return this.teamAccessService.requireWritableMember(teamId, userId);
            case 'member':
                return this.teamAccessService.requireMember(teamId, userId);
        }
    }
}
