import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schema/message.schema';
import { Team, TeamDocument } from '../schema/team.schema';
import { SlackService } from '../slack/slack.service';
import { DiscordService } from '../discord/discord.service';

/**
 * Relay Service (중앙집중식 MVP)
 * - Slack 메시지를 수신하여 Discord로 자동 백업
 * - MongoDB에 메시지 저장
 * - 90일 제한 없는 영구 보관
 */
@Injectable()
export class RelayService implements OnModuleInit {
    private readonly logger = new Logger(RelayService.name);

    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
        private slackService: SlackService,
        private discordService: DiscordService,
    ) {}

    async onModuleInit() {
        // Slack 메시지 이벤트 리스너 등록
        this.slackService.onMessage(async (event) => {
            await this.handleSlackMessage(event);
        });

        this.logger.log('[onModuleInit] Relay Service 시작 - Slack 메시지 이벤트 리스너 등록 완료');
    }

    /**
     * Slack 메시지 수신 처리
     * 1. MongoDB에 저장
     * 2. Discord로 백업 전송
     */
    private async handleSlackMessage(event: any): Promise<void> {
        try {
            // 1. 메시지 정보 추출
            const {
                ts: slackMessageId,
                channel: slackChannelId,
                user: slackUserId,
                text: content,
                thread_ts: threadTs,
                files,
            } = event;

            if (!slackMessageId || !slackChannelId || !content) {
                this.logger.warn('[handleSlackMessage] 필수 필드 누락:', event);
                return;
            }

            // 2. 채널에 해당하는 Team 조회
            const team = await this.teamModel.findOne({ 'slackConfig.channelId': slackChannelId }).exec();

            if (!team) {
                this.logger.warn(`[handleSlackMessage] Team을 찾을 수 없음: Slack Channel=${slackChannelId}`);
                return;
            }

            // 3. Slack 사용자 정보 조회
            const slackUser = await this.slackService.getUserInfo(slackUserId);
            const username = slackUser?.real_name || slackUser?.name || 'Unknown User';
            const userIcon = slackUser?.profile?.image_72;

            // 4. 첨부 파일 정보 추출
            const attachments =
                files?.map((file: any) => ({
                    fileName: file.name,
                    fileUrl: file.url_private,
                    fileType: file.mimetype,
                    fileSize: file.size,
                })) || [];

            // 5. MongoDB에 메시지 저장
            const message = new this.messageModel({
                teamId: team._id,
                slackMessageId,
                slackChannelId,
                slackChannelName: team.slackConfig.channelName,
                slackUserId,
                username,
                userIcon,
                content,
                type: threadTs ? 'thread_reply' : files?.length > 0 ? 'file_share' : 'message',
                threadTs,
                attachments,
                discordChannelId: team.discordConfig.channelId,
                discordWebhookUrl: team.discordConfig.webhookUrl,
                sentAt: new Date(parseFloat(slackMessageId) * 1000),
            });

            const savedMessage = await message.save();

            this.logger.log(
                `[handleSlackMessage] MongoDB 저장 완료: ${savedMessage.slackMessageId} - "${content.substring(0, 50)}"`,
            );

            // 6. Discord로 백업 전송
            try {
                const discordResult = await this.discordService.sendWebhookMessage(team.discordConfig.webhookUrl, {
                    content,
                    username,
                    avatar_url: userIcon,
                    embeds: attachments.map((att) => ({
                        title: att.fileName,
                        url: att.fileUrl,
                        description: `파일 크기: ${(att.fileSize / 1024).toFixed(2)} KB`,
                    })),
                });

                // Discord 메시지 ID 업데이트
                savedMessage.discordMessageId = discordResult.id;
                savedMessage.backedUpAt = new Date();
                await savedMessage.save();

                this.logger.log(
                    `[handleSlackMessage] Discord 백업 완료: Slack=${slackMessageId}, Discord=${discordResult.id}`,
                );
            } catch (discordError) {
                this.logger.error(
                    `[handleSlackMessage] Discord 백업 실패: ${discordError.message}`,
                    discordError.stack,
                );
                // Discord 백업 실패해도 MongoDB 저장은 완료됨
            }
        } catch (error) {
            this.logger.error(`[handleSlackMessage] 메시지 처리 실패: ${error.message}`, error.stack);
        }
    }

    /**
     * 과거 메시지 백업 (최초 셋업 시 사용)
     * @param teamId 팀 ID
     * @param limit 백업할 메시지 개수 (기본 100)
     */
    async backupHistoryMessages(teamId: string, limit: number = 100): Promise<{ backupCount: number }> {
        try {
            // 1. Team 조회
            const team = await this.teamModel.findById(teamId).exec();
            if (!team) {
                throw new Error('Team을 찾을 수 없습니다.');
            }

            // 2. Slack 메시지 히스토리 조회
            const slackMessages = await this.slackService.getMessages(team.slackConfig.channelId, limit);

            let backupCount = 0;

            // 3. 각 메시지 처리
            for (const msg of slackMessages.messages) {
                try {
                    // 이미 저장된 메시지인지 확인
                    const existingMessage = await this.messageModel.findOne({ slackMessageId: msg.messageId }).exec();

                    if (existingMessage) {
                        this.logger.log(`[backupHistoryMessages] 이미 백업됨: ${msg.messageId}`);
                        continue;
                    }

                    // MongoDB에 저장
                    const message = new this.messageModel({
                        teamId: team._id,
                        slackMessageId: msg.messageId,
                        slackChannelId: team.slackConfig.channelId,
                        slackChannelName: team.slackConfig.channelName,
                        slackUserId: '', // 히스토리 조회에서는 사용자 ID 제공 안 됨
                        username: msg.username,
                        content: msg.content,
                        type: 'message',
                        attachments: [],
                        discordChannelId: team.discordConfig.channelId,
                        discordWebhookUrl: team.discordConfig.webhookUrl,
                        sentAt: new Date(msg.timestamp),
                    });

                    await message.save();

                    // Discord로 백업
                    try {
                        const discordResult = await this.discordService.sendWebhookMessage(
                            team.discordConfig.webhookUrl,
                            {
                                content: msg.content,
                                username: msg.username,
                            },
                        );

                        message.discordMessageId = discordResult.id;
                        message.backedUpAt = new Date();
                        await message.save();

                        backupCount++;
                    } catch (discordError) {
                        this.logger.error(`[backupHistoryMessages] Discord 백업 실패: ${discordError.message}`);
                    }
                } catch (msgError) {
                    this.logger.error(`[backupHistoryMessages] 메시지 처리 실패: ${msgError.message}`);
                }
            }

            this.logger.log(`[backupHistoryMessages] 백업 완료: Team=${teamId}, Count=${backupCount}`);

            return { backupCount };
        } catch (error) {
            this.logger.error(`[backupHistoryMessages] 백업 실패: ${error.message}`, error.stack);
            throw error;
        }
    }
}
