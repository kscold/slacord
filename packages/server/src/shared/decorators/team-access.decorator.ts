import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TeamMember, TeamMemberRole } from '../../modules/team/domain/team.entity';

export interface TeamAccessContext {
    member: TeamMember;
    role: TeamMemberRole;
    team: {
        id: string;
        name: string;
        slug: string;
    };
}

/**
 * TeamAccessGuard가 주입한 해결된 팀 접근 컨텍스트를 파라미터로 받는다.
 * `@TeamRole()`이 선언된 엔드포인트에서만 사용해야 한다.
 */
export const TeamAccess = createParamDecorator((_data: unknown, ctx: ExecutionContext): TeamAccessContext => {
    const request = ctx.switchToHttp().getRequest<{ teamAccess?: TeamAccessContext }>();
    if (!request.teamAccess) {
        throw new Error(
            '@TeamAccess() 사용 전 @TeamRole()과 TeamAccessGuard가 선언되어야 합니다.',
        );
    }
    return request.teamAccess;
});
