import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class UpdateMemberAccessUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, actorId: string, memberId: string, input: { role?: 'admin' | 'member'; canManageInvites?: boolean }) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.isOwner(actorId)) throw new BadRequestException('멤버 권한을 변경할 수 없습니다.');
        const target = team.getMember(memberId);
        if (!target) throw new BadRequestException('멤버를 찾을 수 없습니다.');
        if (target.role === 'owner' && input.role) throw new BadRequestException('owner 역할은 여기서 변경할 수 없습니다.');
        const nextMembers = team.members.map((member) =>
            member.userId === memberId
                ? {
                      ...member,
                      role: input.role ?? member.role,
                      canManageInvites: input.canManageInvites ?? member.canManageInvites,
                  }
                : member,
        );
        const updated = await this.teamRepo.replaceAccess(teamId, nextMembers, team.inviteLinks);
        if (!updated) throw new BadRequestException('멤버 권한 변경에 실패했습니다.');
        return updated.getMember(memberId);
    }
}
