import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import type { TeamInviteLink, TeamMember } from '../../domain/team.entity';

@Injectable()
export class JoinTeamByInviteUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(code: string, userId: string) {
        const team = await this.teamRepo.findByInviteCode(code);
        if (!team) throw new BadRequestException('초대 링크가 존재하지 않습니다.');
        const invite = team.getInvite(code);
        if (!invite || !team.isInviteActive(code)) throw new BadRequestException('만료되었거나 비활성화된 초대 링크입니다.');
        if (team.isMember(userId)) return team;

        const nextMembers: TeamMember[] = [
            ...team.members,
            { userId, role: invite.defaultRole, joinedAt: new Date(), canManageInvites: false },
        ];
        const nextInvites: TeamInviteLink[] = team.inviteLinks.map((item) =>
            item.code === code ? { ...item, useCount: item.useCount + 1 } : item,
        );
        const updated = await this.teamRepo.replaceAccess(team.id, nextMembers, nextInvites);
        if (!updated) throw new BadRequestException('초대 참여에 실패했습니다.');
        return updated;
    }
}
