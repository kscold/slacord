import { Inject, Injectable, Logger } from '@nestjs/common';
import { GitHubEventEntity, GitHubEventType } from '../../domain/github-event.entity';
import { MESSAGE_REPOSITORY } from '../../../message/domain/message.port';
import type { IMessageRepository } from '../../../message/domain/message.port';

/** GitHub Webhook 이벤트 처리 유스케이스 */
@Injectable()
export class ProcessGitHubEventUseCase {
    private readonly logger = new Logger(ProcessGitHubEventUseCase.name);

    constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository) {}

    async execute(event: GitHubEventEntity, channelId: string, teamId: string): Promise<void> {
        const content = event.toCardContent();
        const metadata = JSON.stringify({
            github: true,
            eventType: event.eventType,
            url: event.url,
            prNumber: event.prNumber,
            repoName: event.repoName,
        });

        /** system 메시지로 채널에 저장 (content에 JSON 메타데이터 포함) */
        await this.messageRepo.save({
            teamId,
            channelId,
            authorId: 'github-bot',
            content: `${content}\n<!--github:${metadata}-->`,
            type: 'system',
            attachments: [],
            replyToId: null,
            mentions: [],
        });

        this.logger.log(`[processGitHubEvent] Saved GitHub event: ${event.eventType} in channel=${channelId}`);
    }
}
