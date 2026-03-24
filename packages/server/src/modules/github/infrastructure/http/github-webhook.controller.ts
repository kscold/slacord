import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';
import { ProcessGitHubEventUseCase } from '../../application/use-cases/process-github-event.use-case';
import { GitHubEventEntity } from '../../domain/github-event.entity';
import { GithubConfigService } from '../service/github-config.service';
import { MessageGateway } from '../../../message/infrastructure/websocket/message.gateway';

/** GitHub Webhook 수신 컨트롤러 */
@ApiTags('github')
@Controller('github/webhook')
export class GithubWebhookController {
    constructor(
        private readonly processEventUseCase: ProcessGitHubEventUseCase,
        private readonly githubConfigService: GithubConfigService,
        private readonly messageGateway: MessageGateway,
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
        const config = await this.githubConfigService.findByRepo(repoFullName);

        if (!config) {
            return { success: false, message: 'No config found for this repository.' };
        }

        /** HMAC-SHA256 서명 검증 */
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
        const expected = `sha256=${crypto.createHmac('sha256', config.webhookSecret).update(rawBody).digest('hex')}`;
        if (signature !== expected) {
            return { success: false, message: 'Invalid signature.' };
        }

        const parsed = GitHubEventEntity.fromWebhook(eventType, body);
        if (!parsed) return { success: true, message: 'Event ignored.' };

        const message = await this.processEventUseCase.execute(parsed, config.channelId, config.teamId);
        this.messageGateway.emitNewMessage(config.channelId, message.toPublic());
        return { success: true };
    }
}
