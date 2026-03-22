import { Inject, Injectable } from '@nestjs/common';
import type { IIssueRepository } from '../../domain/issue.port';
import { ISSUE_REPOSITORY } from '../../domain/issue.port';
import { IssueEntity, IssueStatus } from '../../domain/issue.entity';

@Injectable()
export class GetIssuesUseCase {
    constructor(@Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository) {}

    async execute(teamId: string, status?: IssueStatus): Promise<IssueEntity[]> {
        return this.issueRepo.findByTeam(teamId, status);
    }
}
