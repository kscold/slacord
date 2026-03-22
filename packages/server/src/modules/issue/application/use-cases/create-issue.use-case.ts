import { Inject, Injectable } from '@nestjs/common';
import type { IIssueRepository } from '../../domain/issue.port';
import { ISSUE_REPOSITORY } from '../../domain/issue.port';
import { IssueEntity, IssuePriority } from '../../domain/issue.entity';

export interface CreateIssueInput {
    teamId: string;
    title: string;
    description?: string;
    priority?: IssuePriority;
    assigneeIds?: string[];
    labels?: string[];
    createdBy: string;
}

@Injectable()
export class CreateIssueUseCase {
    constructor(@Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository) {}

    async execute(input: CreateIssueInput): Promise<IssueEntity> {
        return this.issueRepo.save({
            teamId: input.teamId,
            title: input.title,
            description: input.description ?? '',
            priority: input.priority ?? 'medium',
            assigneeIds: input.assigneeIds ?? [],
            labels: input.labels ?? [],
            createdBy: input.createdBy,
        });
    }
}
