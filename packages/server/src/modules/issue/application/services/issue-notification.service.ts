import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../../auth/domain/auth.port';
import { USER_REPOSITORY } from '../../../auth/domain/auth.port';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

interface NotifyIssueAssigneesInput {
    teamId: string;
    actorId: string;
    assigneeIds?: string[];
    issueId: string;
    issueTitle: string;
}

@Injectable()
export class IssueNotificationService {
    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
        private readonly createNotificationUseCase: CreateNotificationUseCase,
    ) {}

    async notifyAssignees(input: NotifyIssueAssigneesInput) {
        if (!input.assigneeIds?.length) {
            return;
        }

        const actor = await this.userRepo.findById(input.actorId);
        const actorName = actor?.username ?? '팀 동료';

        await this.createNotificationUseCase.executeBulk(
            input.assigneeIds.map((recipientId) => ({
                teamId: input.teamId,
                recipientId,
                type: 'issue_assigned' as const,
                actorId: input.actorId,
                actorName,
                content: `이슈 "${input.issueTitle}" 담당자로 지정됐어요.`,
                resourceType: 'issue' as const,
                resourceId: input.issueId,
            })),
        );
    }
}
