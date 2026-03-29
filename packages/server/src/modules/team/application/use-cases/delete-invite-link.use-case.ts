import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class DeleteInviteLinkUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, code: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.canManageInvites(userId)) throw new BadRequestException('초대 링크를 삭제할 권한이 없습니다.');
        const filtered = team.inviteLinks.filter((invite) => invite.code !== code);
        if (filtered.length === team.inviteLinks.length) throw new BadRequestException('존재하지 않는 초대 링크입니다.');
        await this.teamRepo.replaceAccess(teamId, team.members, filtered);
    }
}
