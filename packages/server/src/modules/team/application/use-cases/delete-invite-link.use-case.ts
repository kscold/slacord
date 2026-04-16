import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import { createTeamAuditLogEntry } from '../../domain/team.entity';

@Injectable()
export class DeleteInviteLinkUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, code: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.canManageInvites(userId)) throw new BadRequestException('초대 링크를 삭제할 권한이 없습니다.');
        const invite = team.getInvite(code);
        if (!invite) throw new BadRequestException('존재하지 않는 초대 링크입니다.');
        const filtered = team.inviteLinks.filter((invite) => invite.code !== code);
        await this.teamRepo.replaceAccess(
            teamId,
            team.members,
            filtered,
            createTeamAuditLogEntry({
                actorId: userId,
                category: 'access',
                action: 'invite_link_deleted',
                summary: '초대 링크를 삭제함',
                target: invite.label ?? invite.code,
                metadata: {
                    code: invite.code,
                    defaultRole: invite.defaultRole,
                },
            }),
        );
    }
}
