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

    /**
     * 한글을 영문으로 변환 (간단한 로마자 변환)
     */
    private koreanToRoman(text: string): string {
        const koreanMap: { [key: string]: string } = {
            개발: 'dev',
            팀: 'team',
            마케팅: 'marketing',
            영업: 'sales',
            디자인: 'design',
            기획: 'planning',
            인사: 'hr',
            총무: 'admin',
            재무: 'finance',
            관리: 'management',
            프로젝트: 'project',
            운영: 'operation',
            지원: 'support',
            고객: 'customer',
            서비스: 'service',
        };

        let result = text;
        for (const [korean, roman] of Object.entries(koreanMap)) {
            result = result.replace(new RegExp(korean, 'g'), roman);
        }
        return result;
    }

    /**
     * 채널 생성 (중앙집중식 MVP용)
     * @param name 채널 이름 (한글은 자동으로 영문 변환)
     * @param description 채널 설명 (선택)
     * @returns 생성된 채널 정보 { channelId, channelName }
     */
    async createChannel(name: string, description?: string): Promise<{ channelId: string; channelName: string }> {
        try {
            // 1. 한글을 영문으로 변환
            let processedName = this.koreanToRoman(name);

            // 2. Slack 채널 이름 규칙: 소문자, 숫자, 하이픈, 언더스코어만 허용
            const sanitizedName =
                processedName
                    .toLowerCase()
                    .replace(/\s+/g, '-') // 공백을 하이픈으로
                    .replace(/[^a-z0-9-_]/g, '') // 허용되지 않는 문자 제거
                    .replace(/^-+|-+$/g, '') // 시작/끝 하이픈 제거
                    .substring(0, 80) || // Slack 채널 이름 최대 길이
                'channel'; // 빈 문자열 방지

            const result = await this.webClient.conversations.create({
                name: sanitizedName,
                is_private: false, // 공개 채널
            });

            // 채널 토픽/설명 설정 (선택)
            if (description && result.channel?.id) {
                await this.webClient.conversations.setTopic({
                    channel: result.channel.id,
                    topic: description.substring(0, 250), // Slack 토픽 최대 길이
                });
            }

            this.logger.log(`[createChannel] Slack 채널 생성 완료: ${sanitizedName} (${result.channel?.id})`);

            return {
                channelId: result.channel?.id || '',
                channelName: result.channel?.name || sanitizedName,
            };
        } catch (error) {
            this.logger.error(`[createChannel] Slack 채널 생성 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 채널 삭제
     * @param channelId 삭제할 채널 ID
     */
    async deleteChannel(channelId: string): Promise<void> {
        try {
            await this.webClient.conversations.archive({
                channel: channelId,
            });
            this.logger.log(`[deleteChannel] Slack 채널 아카이브 완료: ${channelId}`);
        } catch (error) {
            this.logger.error(`[deleteChannel] Slack 채널 아카이브 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 특정 채널에 메시지 전송 (중앙집중식 MVP용)
     * @param channelId Slack 채널 ID
     * @param text 메시지 내용
     * @param username 발신자 이름 (선택)
     * @returns { messageTs, channelId, timestamp }
     */
    async postMessage(
        channelId: string,
        text: string,
        username?: string,
    ): Promise<{ messageTs: string; channelId: string; timestamp: string }> {
        try {
            const result = await this.webClient.chat.postMessage({
                channel: channelId,
                text,
                username, // Bot이 사용자 이름으로 메시지 전송
            });

            this.logger.log(`[postMessage] Slack 메시지 전송 완료: ${channelId} - ${text.substring(0, 50)}...`);

            return {
                messageTs: result.ts as string,
                channelId: result.channel as string,
                timestamp: new Date(parseFloat(result.ts as string) * 1000).toISOString(),
            };
        } catch (error) {
            this.logger.error(`[postMessage] Slack 메시지 전송 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 채널 메시지 히스토리 조회 (중앙집중식 MVP용)
     * @param channelId Slack 채널 ID
     * @param limit 조회할 메시지 개수 (기본 50, 최대 100)
     * @param oldest 조회 시작 타임스탬프 (이 시간 이후 메시지 조회)
     * @param latest 조회 종료 타임스탬프 (이 시간 이전 메시지 조회)
     * @returns { messages, hasMore, nextCursor }
     */
    async getMessages(
        channelId: string,
        limit: number = 50,
        oldest?: string,
        latest?: string,
    ): Promise<{
        messages: Array<{
            messageId: string;
            content: string;
            username: string;
            timestamp: string;
        }>;
        hasMore: boolean;
        nextCursor?: string;
    }> {
        try {
            const result = await this.webClient.conversations.history({
                channel: channelId,
                limit,
                oldest, // Unix timestamp (초)
                latest, // Unix timestamp (초)
            });

            // 메시지에 포함된 username 필드를 그대로 사용 (users:read 스코프 불필요)
            const messages =
                result.messages?.map((msg: any) => ({
                    messageId: msg.ts,
                    content: msg.text || '',
                    username: msg.username || msg.user || 'Unknown', // username 우선, 없으면 user ID
                    timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
                })) || [];

            this.logger.log(`[getMessages] Slack 메시지 조회 완료: ${channelId} - ${messages.length}개`);

            return {
                messages,
                hasMore: result.has_more || false,
                nextCursor: result.messages?.[result.messages.length - 1]?.ts,
            };
        } catch (error) {
            this.logger.error(`[getMessages] Slack 메시지 조회 실패: ${error.message}`);
            throw error;
        }
    }
}
