import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';

@Injectable()
export class NotificationAccessService {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async ensureMember(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) {
            throw new ForbiddenException('워크스페이스를 찾을 수 없습니다.');
        }
        if (!team.isMember(userId)) {
            throw new ForbiddenException('이 워크스페이스의 멤버가 아닙니다.');
        }
    }
}
