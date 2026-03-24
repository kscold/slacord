import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class GetInvitePreviewUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(code: string) {
        const team = await this.teamRepo.findByInviteCode(code);
        if (!team) throw new BadRequestException('초대 링크가 존재하지 않습니다.');
        const invite = team.getInvite(code);
        if (!invite) throw new BadRequestException('초대 링크를 찾지 못했습니다.');
        return {
            code: invite.code,
            teamId: team.id,
            teamName: team.name,
            teamSlug: team.slug,
            defaultRole: invite.defaultRole,
            expiresAt: invite.expiresAt,
            maxUses: invite.maxUses,
            useCount: invite.useCount,
            active: team.isInviteActive(code),
        };
    }
}
