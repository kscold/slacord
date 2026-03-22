import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';
import { ProcessGitHubEventUseCase } from '../../application/use-cases/process-github-event.use-case';
import { GitHubEventEntity, GitHubEventType } from '../../domain/github-event.entity';
import { GithubConfigService } from '../service/github-config.service';

/** GitHub Webhook 수신 컨트롤러 */
@ApiTags('github')
@Controller('github/webhook')
export class GithubWebhookController {
    constructor(
        private readonly processEventUseCase: ProcessGitHubEventUseCase,
        private readonly githubConfigService: GithubConfigService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'GitHub Webhook 수신 (GitHub에서 호출)' })
    async handleWebhook(
        @Headers('x-github-event') eventType: string,
        @Headers('x-hub-signature-256') signature: string,
        @Body() body: any,
        @Req() req: Request & { rawBody?: Buffer },
    ) {
        /** 팀 설정에서 channelId, teamId, secret 조회 */
        const repoFullName: string = body?.repository?.full_name ?? '';
        const config = this.githubConfigService.findByRepo(repoFullName);

        if (!config) {
            return { success: false, message: 'No config found for this repository.' };
        }

        /** HMAC-SHA256 서명 검증 */
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
        const expected = `sha256=${crypto.createHmac('sha256', config.webhookSecret).update(rawBody).digest('hex')}`;
        if (signature !== expected) {
            return { success: false, message: 'Invalid signature.' };
        }

        const parsed = this.parseEvent(eventType, body);
        if (!parsed) return { success: true, message: 'Event ignored.' };

        await this.processEventUseCase.execute(parsed, config.channelId, config.teamId);
        return { success: true };
    }

    private parseEvent(eventType: string, body: any): GitHubEventEntity | null {
        const repo: string = body?.repository?.full_name ?? 'unknown';
        const actor: string = body?.sender?.login ?? 'unknown';
        const pr = body?.pull_request;
        const prNumber: number | null = pr?.number ?? null;
        const prTitle: string = pr?.title ?? '';
        const prUrl: string = pr?.html_url ?? '';

        if (eventType === 'pull_request') {
            const action: string = body?.action ?? '';
            if (action === 'opened') {
                return new GitHubEventEntity('pr_opened', repo, prNumber, prTitle, prUrl, actor, {});
            }
            if (action === 'closed' && pr?.merged) {
                return new GitHubEventEntity('pr_merged', repo, prNumber, prTitle, prUrl, actor, {});
            }
            if (action === 'closed' && !pr?.merged) {
                return new GitHubEventEntity('pr_closed', repo, prNumber, prTitle, prUrl, actor, {});
            }
            if (action === 'review_requested') {
                const reviewer: string = body?.requested_reviewer?.login ?? '';
                return new GitHubEventEntity('pr_review_requested', repo, prNumber, prTitle, prUrl, actor, {
                    reviewer,
                });
            }
        }

        if (eventType === 'pull_request_review') {
            const state: string = body?.review?.state ?? '';
            const type: GitHubEventType = state === 'approved' ? 'pr_approved' : 'pr_changes_requested';
            return new GitHubEventEntity(type, repo, prNumber, prTitle, prUrl, actor, {});
        }

        if (eventType === 'check_run') {
            const conclusion: string = body?.check_run?.conclusion ?? '';
            if (conclusion === 'success') {
                return new GitHubEventEntity('ci_passed', repo, null, repo, '', actor, {});
            }
            if (conclusion === 'failure') {
                return new GitHubEventEntity('ci_failed', repo, null, repo, '', actor, {});
            }
        }

        return null;
    }
}
