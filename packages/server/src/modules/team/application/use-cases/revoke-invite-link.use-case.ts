import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import { createTeamAuditLogEntry } from '../../domain/team.entity';
import { CLOCK, type Clock } from '../../../../shared/lib/clock';

@Injectable()
export class RevokeInviteLinkUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    async execute(teamId: string, code: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.canManageInvites(userId)) throw new BadRequestException('초대 링크를 비활성화할 수 없습니다.');
        const invite = team.getInvite(code);
        if (!invite) throw new BadRequestException('존재하지 않는 초대 링크입니다.');
        const updated = await this.teamRepo.replaceAccess(
            teamId,
            team.members,
            team.inviteLinks.map((invite) => (invite.code === code ? { ...invite, revokedAt: this.clock.now() } : invite)),
            createTeamAuditLogEntry({
                actorId: userId,
                category: 'access',
                action: 'invite_link_revoked',
                summary: '초대 링크를 비활성화함',
                target: invite.label ?? invite.code,
                metadata: {
                    code: invite.code,
                    defaultRole: invite.defaultRole,
                },
            }),
        );
        if (!updated) throw new BadRequestException('초대 링크 비활성화에 실패했습니다.');
        return updated.inviteLinks.find((invite) => invite.code === code) ?? null;
    }
}
