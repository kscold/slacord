import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IIssueRepository } from '../../domain/issue.port';
import { ISSUE_REPOSITORY } from '../../domain/issue.port';
import { IssueEntity, IssueStatus, IssuePriority } from '../../domain/issue.entity';

export interface UpdateIssueInput {
    id: string;
    title?: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeIds?: string[];
    labels?: string[];
}

@Injectable()
export class UpdateIssueUseCase {
    constructor(@Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository) {}

    async execute(input: UpdateIssueInput): Promise<IssueEntity> {
        const { id, ...data } = input;
        const updated = await this.issueRepo.update(id, data);
        if (!updated) throw new BadRequestException('존재하지 않는 이슈입니다.');
        return updated;
    }
}
