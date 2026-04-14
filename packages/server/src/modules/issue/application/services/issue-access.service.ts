import { Injectable } from '@nestjs/common';
import { TeamAccessService } from '../../../team/application/services/team-access.service';

@Injectable()
export class IssueAccessService {
    constructor(private readonly teamAccessService: TeamAccessService) {}

    async ensureMember(teamId: string, userId: string) {
        await this.teamAccessService.requireMember(teamId, userId);
    }

    async ensureWritableMember(teamId: string, userId: string) {
        await this.teamAccessService.requireWritableMember(teamId, userId);
    }
}
