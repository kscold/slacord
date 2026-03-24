import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class GetInviteLinksUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.canManageInvites(userId)) throw new BadRequestException('초대 링크를 볼 수 없습니다.');
        return team.inviteLinks
            .map((invite) => ({ ...invite, active: team.isInviteActive(invite.code) }))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}
