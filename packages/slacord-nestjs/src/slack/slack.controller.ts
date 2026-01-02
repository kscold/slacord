import { Body, Controller, Post, Logger, Headers } from '@nestjs/common';

import { SlackService } from './slack.service';

/**
 * Slack Event API 수신용 컨트롤러
 * Socket Mode를 사용하지 않을 경우 이 엔드포인트로 이벤트 수신
 */
@Controller('slack')
export class SlackController {
    private readonly logger = new Logger(SlackController.name);

    constructor(private readonly slackService: SlackService) {}

    /**
     * Slack Event API 엔드포인트
     * - URL Verification (초기 설정)
     * - Event Callback (메시지 등)
     */
    @Post('events')
    async handleEvents(
        @Body() body: any,
        @Headers('x-slack-signature') signature: string,
        @Headers('x-slack-request-timestamp') timestamp: string,
    ) {
        this.logger.log(`[handleEvents] 이벤트 수신: ${body.type}`);

        // URL Verification Challenge
        if (body.type === 'url_verification') {
            this.logger.log('[handleEvents] URL 검증 요청');
            return { challenge: body.challenge };
        }

        // Event Callback
        if (body.type === 'event_callback') {
            const event = body.event;
            this.logger.log(`[handleEvents] 이벤트 타입: ${event.type}`);

            // 메시지 이벤트는 SlackService에서 처리
            // (Socket Mode가 아닌 HTTP 모드일 때 사용)
        }

        return { ok: true };
    }
}
