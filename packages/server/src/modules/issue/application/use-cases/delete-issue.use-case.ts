import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IIssueRepository } from '../../domain/issue.port';
import { ISSUE_REPOSITORY } from '../../domain/issue.port';

@Injectable()
export class DeleteIssueUseCase {
    constructor(@Inject(ISSUE_REPOSITORY) private readonly issueRepo: IIssueRepository) {}

    async execute(id: string): Promise<void> {
        const deleted = await this.issueRepo.deleteById(id);
        if (!deleted) throw new BadRequestException('존재하지 않는 이슈입니다.');
    }
}
