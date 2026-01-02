import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlackService } from '../slack/slack.service';
import { DiscordService } from '../discord/discord.service';

/**
 * Relay 서비스
 * - Slack 메시지 이벤트를 감지하여 Discord로 전달
 * - 특정 채널만 필터링하여 백업
 */
@Injectable()
export class RelayService implements OnModuleInit {
    private readonly logger = new Logger(RelayService.name);
    private targetChannels: string[] = [];

    constructor(
        private slackService: SlackService,
        private discordService: DiscordService,
        private configService: ConfigService,
    ) {}

    async onModuleInit() {
        // 백업할 Slack 채널 ID 목록 (환경변수에서 읽기)
        const channelIds = this.configService.get<string>('SLACK_TARGET_CHANNELS');
        if (channelIds) {
            this.targetChannels = channelIds.split(',').map((id) => id.trim());
            this.logger.log(`[onModuleInit] 백업 대상 채널: ${this.targetChannels.join(', ')}`);
        } else {
            this.logger.warn('[onModuleInit] SLACK_TARGET_CHANNELS 미설정. 모든 채널 백업.');
        }

        // Slack 메시지 핸들러 등록
        this.slackService.onMessage(async (message) => {
            await this.handleSlackMessage(message);
        });

        this.logger.log('[onModuleInit] Relay 서비스 초기화 완료');
    }

    /**
     * Slack 메시지 처리 및 Discord로 전달
     */
    private async handleSlackMessage(message: any): Promise<void> {
        try {
            const { channel, user, text, files } = message;

            // 채널 필터링 (설정된 채널만 백업)
            if (this.targetChannels.length > 0 && !this.targetChannels.includes(channel)) {
                this.logger.debug(`[handleSlackMessage] 채널 ${channel}은 백업 대상이 아닙니다.`);
                return;
            }

            // 사용자 정보 조회
            const userInfo = await this.slackService.getUserInfo(user);
            const username = userInfo?.real_name || userInfo?.name || 'Unknown User';
            const avatarUrl = userInfo?.profile?.image_72;

            // 채널 정보 조회
            const channelInfo = await this.slackService.getChannelInfo(channel);
            const channelName = channelInfo?.name || channel;

            this.logger.log(`[handleSlackMessage] 메시지 백업: #${channelName} - ${username}`);

            // 메시지 내용 포맷팅
            const formattedMessage = `**[#${channelName}]** ${username}: ${text}`;

            // Discord로 전송
            if (files && files.length > 0) {
                // 파일이 있는 경우
                for (const file of files) {
                    await this.discordService.sendMessageWithFile(formattedMessage, file.url_private, username);
                }
            } else {
                // 일반 메시지
                await this.discordService.sendMessage(formattedMessage, username, avatarUrl);
            }

            this.logger.log('[handleSlackMessage] Discord 백업 완료');
        } catch (error) {
            this.logger.error(`[handleSlackMessage] 메시지 처리 실패: ${error.message}`, error.stack);
        }
    }

    /**
     * 특정 채널 백업 활성화
     */
    addTargetChannel(channelId: string): void {
        if (!this.targetChannels.includes(channelId)) {
            this.targetChannels.push(channelId);
            this.logger.log(`[addTargetChannel] 채널 추가: ${channelId}`);
        }
    }

    /**
     * 특정 채널 백업 비활성화
     */
    removeTargetChannel(channelId: string): void {
        this.targetChannels = this.targetChannels.filter((id) => id !== channelId);
        this.logger.log(`[removeTargetChannel] 채널 제거: ${channelId}`);
    }

    /**
     * 현재 백업 대상 채널 목록 조회
     */
    getTargetChannels(): string[] {
        return [...this.targetChannels];
    }
}
