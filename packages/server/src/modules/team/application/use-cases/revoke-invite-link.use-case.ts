import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class RevokeInviteLinkUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, code: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.canManageInvites(userId)) throw new BadRequestException('초대 링크를 비활성화할 수 없습니다.');
        const updated = await this.teamRepo.replaceAccess(
            teamId,
            team.members,
            team.inviteLinks.map((invite) => (invite.code === code ? { ...invite, revokedAt: new Date() } : invite)),
        );
        if (!updated) throw new BadRequestException('초대 링크 비활성화에 실패했습니다.');
        return updated.inviteLinks.find((invite) => invite.code === code) ?? null;
    }
}
