import { Inject, Injectable } from '@nestjs/common';
import type { IIssueRepository, IssueSearchFilters } from '../../domain/issue.port';
import { ISSUE_REPOSITORY } from '../../domain/issue.port';
import { IssueEntity } from '../../domain/issue.entity';

@Injectable()
export class GetIssuesUseCase {
    constructor(@Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository) {}

    async execute(teamId: string, filters?: IssueSearchFilters): Promise<IssueEntity[]> {
        return this.issueRepo.findByTeam(teamId, filters);
    }
}
