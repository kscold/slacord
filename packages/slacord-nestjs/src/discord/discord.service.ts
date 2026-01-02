import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Client, GatewayIntentBits, ChannelType, TextChannel } from 'discord.js';

/**
 * Discord Bot & Webhook 서비스
 * - Slack 메시지를 Discord로 백업
 * - Discord를 영구 저장소로 활용 (90일 제한 없음)
 * - 중앙집중식 MVP: Discord 채널 자동 생성
 */
@Injectable()
export class DiscordService implements OnModuleInit {
    private readonly logger = new Logger(DiscordService.name);
    private webhookUrl: string;
    private client: Client;
    private isReady = false;

    constructor(private configService: ConfigService) {
        this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL') || '';
    }

    async onModuleInit() {
        const token = this.configService.get<string>('DISCORD_BOT_TOKEN');
        if (!token) {
            this.logger.warn('[onModuleInit] Discord Bot Token이 설정되지 않았습니다.');
            return;
        }

        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        });

        this.client.once('ready', () => {
            this.logger.log(`[onModuleInit] Discord Bot 로그인 완료: ${this.client.user?.tag}`);
            this.isReady = true;
        });

        await this.client.login(token);
    }

    /**
     * Discord로 메시지 전송 (백업)
     * @param content 메시지 내용
     * @param username 발신자 이름
     * @param avatarUrl 발신자 프로필 이미지
     */
    async sendMessage(content: string, username?: string, avatarUrl?: string): Promise<void> {
        if (!this.webhookUrl) {
            this.logger.warn('[sendMessage] Discord Webhook URL이 설정되지 않았습니다.');
            return;
        }

        try {
            const payload = {
                content,
                username: username || 'Slack Archive Bot',
                avatar_url: avatarUrl,
            };

            await axios.post(this.webhookUrl, payload);
            this.logger.log(`[sendMessage] Discord 백업 완료: ${content.substring(0, 50)}...`);
        } catch (error) {
            this.logger.error(`[sendMessage] Discord 전송 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 파일 포함 메시지 전송
     * @param content 메시지 내용
     * @param fileUrl 파일 URL
     * @param username 발신자 이름
     */
    async sendMessageWithFile(content: string, fileUrl: string, username?: string): Promise<void> {
        if (!this.webhookUrl) {
            this.logger.warn('[sendMessageWithFile] Discord Webhook URL이 설정되지 않았습니다.');
            return;
        }

        try {
            const payload = {
                content: `${content}\n\n📎 파일: ${fileUrl}`,
                username: username || 'Slack Archive Bot',
            };

            await axios.post(this.webhookUrl, payload);
            this.logger.log(`[sendMessageWithFile] Discord 파일 백업 완료: ${fileUrl}`);
        } catch (error) {
            this.logger.error(`[sendMessageWithFile] Discord 파일 전송 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 임베드 메시지 전송 (구조화된 메시지)
     * @param title 제목
     * @param description 내용
     * @param fields 추가 필드들
     * @param color 색상 (hex)
     */
    async sendEmbed(
        title: string,
        description: string,
        fields?: { name: string; value: string; inline?: boolean }[],
        color?: string,
    ): Promise<void> {
        if (!this.webhookUrl) {
            this.logger.warn('[sendEmbed] Discord Webhook URL이 설정되지 않았습니다.');
            return;
        }

        try {
            const payload = {
                embeds: [
                    {
                        title,
                        description,
                        fields,
                        color: color ? parseInt(color.replace('#', ''), 16) : 0x5865f2, // 기본 Discord 파란색
                        timestamp: new Date().toISOString(),
                    },
                ],
            };

            await axios.post(this.webhookUrl, payload);
            this.logger.log(`[sendEmbed] Discord 임베드 백업 완료: ${title}`);
        } catch (error) {
            this.logger.error(`[sendEmbed] Discord 임베드 전송 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 한글을 영문으로 변환 (Slack과 동일한 로직)
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
     * @returns 생성된 채널 정보 { channelId, channelName, webhookUrl }
     */
    async createChannel(
        name: string,
        description?: string,
    ): Promise<{ channelId: string; channelName: string; webhookUrl: string }> {
        if (!this.isReady || !this.client) {
            throw new Error('Discord Bot이 준비되지 않았습니다.');
        }

        try {
            const guildId = this.configService.get<string>('DISCORD_GUILD_ID');
            if (!guildId) {
                throw new Error('DISCORD_GUILD_ID가 설정되지 않았습니다.');
            }

            const guild = await this.client.guilds.fetch(guildId);

            // 1. 한글을 영문으로 변환
            let processedName = this.koreanToRoman(name);

            // 2. Discord 채널 이름 규칙: 소문자, 숫자, 하이픈, 언더스코어만 허용
            const sanitizedName =
                processedName
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-_]/g, '')
                    .replace(/^-+|-+$/g, '')
                    .substring(0, 100) || // Discord 채널 이름 최대 길이
                'channel'; // 빈 문자열 방지

            // 채널 생성
            const channel = await guild.channels.create({
                name: sanitizedName,
                type: ChannelType.GuildText,
                topic: description ? description.substring(0, 1024) : undefined, // Discord 토픽 최대 길이
            });

            // Webhook 생성 (메시지 전송용)
            const webhook = await (channel as TextChannel).createWebhook({
                name: 'Slacord Backup',
                avatar: undefined,
            });

            this.logger.log(`[createChannel] Discord 채널 생성 완료: ${sanitizedName} (${channel.id})`);

            return {
                channelId: channel.id,
                channelName: channel.name,
                webhookUrl: webhook.url,
            };
        } catch (error) {
            this.logger.error(`[createChannel] Discord 채널 생성 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 채널 삭제
     * @param channelId 삭제할 채널 ID
     */
    async deleteChannel(channelId: string): Promise<void> {
        if (!this.isReady || !this.client) {
            throw new Error('Discord Bot이 준비되지 않았습니다.');
        }

        try {
            const channel = await this.client.channels.fetch(channelId);
            if (channel?.isTextBased()) {
                await channel.delete();
                this.logger.log(`[deleteChannel] Discord 채널 삭제 완료: ${channelId}`);
            }
        } catch (error) {
            this.logger.error(`[deleteChannel] Discord 채널 삭제 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * Discord 채널 메시지 조회 (90일 이전 메시지용)
     * @param channelId Discord 채널 ID
     * @param limit 조회할 메시지 개수 (기본 50, 최대 100)
     * @param before 이 메시지 ID 이전의 메시지 조회 (페이지네이션용)
     * @returns { messages, hasMore, nextCursor }
     */
    async getMessages(
        channelId: string,
        limit: number = 50,
        before?: string,
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
        if (!this.isReady || !this.client) {
            throw new Error('Discord Bot이 준비되지 않았습니다.');
        }

        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel?.isTextBased()) {
                throw new Error('텍스트 채널이 아닙니다.');
            }

            // Discord 메시지 조회 (최신순)
            const fetchedMessages = await (channel as any).messages.fetch({
                limit,
                before, // 이 메시지 ID 이전의 메시지
            });

            const messages = fetchedMessages.map((msg: any) => ({
                messageId: msg.id,
                content: msg.content || '',
                username: msg.author?.username || msg.author?.tag || 'Unknown',
                timestamp: msg.createdAt.toISOString(),
            }));

            this.logger.log(`[getMessages] Discord 메시지 조회 완료: ${channelId} - ${messages.length}개`);

            return {
                messages: Array.from(messages.values()), // Collection을 배열로 변환
                hasMore: fetchedMessages.size === limit, // 요청한 개수만큼 받았으면 더 있을 가능성
                nextCursor: messages.length > 0 ? messages[messages.length - 1].messageId : undefined,
            };
        } catch (error) {
            this.logger.error(`[getMessages] Discord 메시지 조회 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * Webhook으로 메시지 전송 (중앙집중식 MVP용)
     * @param webhookUrl Webhook URL
     * @param payload Webhook 페이로드
     * @returns Discord 메시지 정보 { id, channelId }
     */
    async sendWebhookMessage(
        webhookUrl: string,
        payload: {
            content: string;
            username?: string;
            avatar_url?: string;
            embeds?: Array<{
                title?: string;
                description?: string;
                url?: string;
                color?: number;
                fields?: Array<{ name: string; value: string; inline?: boolean }>;
            }>;
        },
    ): Promise<{ id: string; channelId: string }> {
        try {
            const response = await axios.post(`${webhookUrl}?wait=true`, payload);

            this.logger.log(
                `[sendWebhookMessage] Discord Webhook 메시지 전송 완료: ${payload.content.substring(0, 50)}...`,
            );

            return {
                id: response.data.id,
                channelId: response.data.channel_id,
            };
        } catch (error) {
            this.logger.error(`[sendWebhookMessage] Discord Webhook 전송 실패: ${error.message}`);
            throw error;
        }
    }
}
