import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';

@Injectable()
export class GetTeamUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.isMember(userId)) {
            throw new BadRequestException('접근할 수 없는 팀입니다.');
        }
        return team;
    }
}
