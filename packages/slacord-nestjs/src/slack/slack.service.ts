import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackService implements OnModuleInit {
    private readonly logger = new Logger(SlackService.name);
    private app: App;
    private webClient: WebClient;

    // 메시지 이벤트 리스너 (외부에서 등록)
    private messageHandler: ((event: any) => Promise<void>) | null = null;

    constructor(private configService: ConfigService) {}

    async onModuleInit() {
        const token = this.configService.get<string>('SLACK_BOT_TOKEN');
        const signingSecret = this.configService.get<string>('SLACK_SIGNING_SECRET');
        const appToken = this.configService.get<string>('SLACK_APP_TOKEN');

        if (!token || !signingSecret) {
            this.logger.warn('Slack credentials not configured. Skipping initialization.');
            return;
        }

        this.webClient = new WebClient(token);

        this.app = new App({
            token,
            signingSecret,
            appToken,
            socketMode: !!appToken, // App Token이 있으면 Socket Mode 사용
            logLevel: LogLevel.INFO,
        });

        // 메시지 이벤트 리스너 등록
        this.app.message(async ({ message, say }) => {
            // bot 메시지는 무시 (무한 루프 방지)
            if ('bot_id' in message) return;

            this.logger.log(`[onMessage] 새 메시지 수신: ${JSON.stringify(message)}`);

            if (this.messageHandler) {
                await this.messageHandler(message);
            }
        });

        // Socket Mode인 경우 앱 시작
        if (appToken) {
            await this.app.start();
            this.logger.log('[onModuleInit] Slack Bot started in Socket Mode');
        }
    }

    /**
     * 메시지 핸들러 등록
     */
    onMessage(handler: (event: any) => Promise<void>) {
        this.messageHandler = handler;
    }

    /**
     * 채널 정보 조회
     */
    async getChannelInfo(channelId: string) {
        try {
            const result = await this.webClient.conversations.info({
                channel: channelId,
            });
            return result.channel;
        } catch (error) {
            this.logger.error(`[getChannelInfo] 채널 조회 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 사용자 정보 조회
     */
    async getUserInfo(userId: string) {
        try {
            const result = await this.webClient.users.info({ user: userId });
            return result.user;
        } catch (error) {
            this.logger.error(`[getUserInfo] 사용자 조회 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 메시지 전송
     */
    async sendMessage(channel: string, text: string) {
        try {
            const result = await this.webClient.chat.postMessage({ channel, text });
            this.logger.log(`[sendMessage] 메시지 전송 완료: ${channel}`);
            return result;
        } catch (error) {
            this.logger.error(`[sendMessage] 메시지 전송 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * Slack Event API 검증용 (URL Verification)
     */
    handleUrlVerification(challenge: string): string {
        return challenge;
    }
}
