import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    NOTIFICATION_EVENTS,
    type IssueAssignedEvent,
} from '../../../../shared/events/notification-events';

interface NotifyIssueAssigneesInput {
    teamId: string;
    actorId: string;
    assigneeIds?: string[];
    issueId: string;
    issueTitle: string;
}

/**
 * 이슈 담당자 지정 알림 디스패치.
 * 이벤트만 emit하고, 실제 알림 생성은 NotificationEventListener가 담당한다.
 */
@Injectable()
export class IssueNotificationService {
    constructor(private readonly eventEmitter: EventEmitter2) {}

    notifyAssignees(input: NotifyIssueAssigneesInput): void {
        if (!input.assigneeIds?.length) return;

        const event: IssueAssignedEvent = {
            teamId: input.teamId,
            recipientIds: input.assigneeIds,
            actorId: input.actorId,
            issueId: input.issueId,
            issueTitle: input.issueTitle,
        };
        this.eventEmitter.emit(NOTIFICATION_EVENTS.ISSUE_ASSIGNED, event);
    }
}
