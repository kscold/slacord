import { Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY } from '../../domain/team.port';
import type { ITeamRepository } from '../../domain/team.port';
import { USER_REPOSITORY } from '../../../auth/domain/auth.port';
import type { IUserRepository } from '../../../auth/domain/auth.port';

@Injectable()
export class GetTeamMembersUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    ) {}

    async execute(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team || !team.isMember(userId)) {
            return [];
        }
        const users = await this.userRepo.findByIds(team.members.map((member) => member.userId));
        return team.members.map((member) => ({
            ...member,
            user: users.find((user) => user.id === member.userId)?.toPublic() ?? null,
        }));
    }
}
