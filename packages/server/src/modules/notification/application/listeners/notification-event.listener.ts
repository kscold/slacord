import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_REPOSITORY, type IUserRepository } from '../../../auth/domain/auth.port';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import {
    NOTIFICATION_EVENTS,
    type IssueAssignedEvent,
    type MentionedEvent,
    type ThreadRepliedEvent,
} from '../../../../shared/events/notification-events';

/**
 * 도메인 이벤트 → 실제 알림 생성 브리지.
 * 비즈니스 use case는 이벤트만 emit하고, 이 리스너가 알림 모듈의 책임으로
 * 알림 엔티티를 생성한다.
 */
@Injectable()
export class NotificationEventListener {
    private readonly logger = new Logger(NotificationEventListener.name);

    constructor(
        private readonly createNotification: CreateNotificationUseCase,
        @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    ) {}

    @OnEvent(NOTIFICATION_EVENTS.MENTIONED, { async: true })
    async handleMentioned(event: MentionedEvent): Promise<void> {
        if (event.recipientIds.length === 0) return;
        try {
            await this.createNotification.executeBulk(
                event.recipientIds.map((recipientId) => ({
                    teamId: event.teamId,
                    recipientId,
                    type: 'mention',
                    actorId: event.actorId,
                    actorName: event.actorName,
                    content: event.content.slice(0, 160) || '새 멘션',
                    resourceType: event.resourceType,
                    resourceId: event.resourceId,
                    channelId: event.channelId ?? undefined,
                })),
            );
        } catch (err) {
            this.logger.warn(`mention 알림 생성 실패: ${(err as Error).message}`);
        }
    }

    @OnEvent(NOTIFICATION_EVENTS.THREAD_REPLIED, { async: true })
    async handleThreadReplied(event: ThreadRepliedEvent): Promise<void> {
        try {
            await this.createNotification.execute({
                teamId: event.teamId,
                recipientId: event.recipientId,
                type: 'thread_reply',
                actorId: event.actorId,
                actorName: event.actorName,
                content: event.content.slice(0, 160) || '새 답글',
                resourceType: event.resourceType,
                resourceId: event.resourceId,
                channelId: event.channelId ?? undefined,
            });
        } catch (err) {
            this.logger.warn(`thread_reply 알림 생성 실패: ${(err as Error).message}`);
        }
    }

    @OnEvent(NOTIFICATION_EVENTS.ISSUE_ASSIGNED, { async: true })
    async handleIssueAssigned(event: IssueAssignedEvent): Promise<void> {
        if (event.recipientIds.length === 0) return;
        try {
            const actor = await this.userRepo.findById(event.actorId);
            const actorName = actor?.username ?? '팀 동료';
            await this.createNotification.executeBulk(
                event.recipientIds.map((recipientId) => ({
                    teamId: event.teamId,
                    recipientId,
                    type: 'issue_assigned',
                    actorId: event.actorId,
                    actorName,
                    content: `이슈 "${event.issueTitle}" 담당자로 지정됐어요.`,
                    resourceType: 'issue',
                    resourceId: event.issueId,
                })),
            );
        } catch (err) {
            this.logger.warn(`issue_assigned 알림 생성 실패: ${(err as Error).message}`);
        }
    }
}
