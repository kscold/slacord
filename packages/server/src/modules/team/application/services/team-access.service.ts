import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import type { TeamMember, TeamMemberRole } from '../../domain/team.entity';
import { hasAdminRole, hasWriteRole } from '../../domain/team.entity';

interface TeamAccess {
    member: TeamMember;
    role: TeamMemberRole;
    team: {
        id: string;
        name: string;
        slug: string;
    };
}

@Injectable()
export class TeamAccessService {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async requireMember(teamId: string, userId: string): Promise<TeamAccess> {
        const team = await this.teamRepo.findById(teamId);
        if (!team) {
            throw new ForbiddenException('워크스페이스를 찾을 수 없습니다.');
        }

        const member = team.getMember(userId);
        if (!member) {
            throw new ForbiddenException('이 워크스페이스의 멤버가 아닙니다.');
        }

        return {
            member,
            role: member.role,
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        };
    }

    async requireWritableMember(teamId: string, userId: string): Promise<TeamAccess> {
        const access = await this.requireMember(teamId, userId);
        if (!hasWriteRole(access.role)) {
            throw new ForbiddenException('게스트는 읽기 전용입니다.');
        }
        return access;
    }

    async requireAdmin(teamId: string, userId: string): Promise<TeamAccess> {
        const access = await this.requireMember(teamId, userId);
        if (!hasAdminRole(access.role)) {
            throw new ForbiddenException('관리자 권한이 필요합니다.');
        }
        return access;
    }

    async requireOwner(teamId: string, userId: string): Promise<TeamAccess> {
        const access = await this.requireMember(teamId, userId);
        if (access.role !== 'owner') {
            throw new ForbiddenException('오너 권한이 필요합니다.');
        }
        return access;
    }
}
