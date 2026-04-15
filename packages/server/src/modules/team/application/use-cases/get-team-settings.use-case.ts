import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class GetTeamSettingsUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(userId)) {
            throw new BadRequestException('민감한 팀 설정을 조회할 권한이 없습니다.');
        }
        return team;
    }
}
