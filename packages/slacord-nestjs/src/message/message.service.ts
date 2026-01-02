import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schema/message.schema';
import { Team, TeamDocument } from '../schema/team.schema';
import { SlackService } from '../slack/slack.service';
import { DiscordService } from '../discord/discord.service';
import { SendMessageRequestDto } from './dto/request/send-message-request.dto';
import { GetMessagesRequestDto } from './dto/request/get-messages-request.dto';
import { SendMessageResponseDto } from './dto/response/send-message-response.dto';
import { GetMessagesResponseDto } from './dto/response/get-messages-response.dto';

/**
 * 메시지 저장 및 검색 서비스 (중앙집중식 MVP)
 */
@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    // Slack 90일 보관 정책 (밀리초)
    private readonly SLACK_RETENTION_DAYS = 90;
    private readonly SLACK_RETENTION_MS = this.SLACK_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
        private slackService: SlackService,
        private discordService: DiscordService,
    ) {}

    /**
     * 메시지 저장
     */
    async saveMessage(messageData: Partial<Message>): Promise<MessageDocument> {
        try {
            const message = new this.messageModel(messageData);
            const saved = await message.save();
            this.logger.log(`[saveMessage] 메시지 저장 완료: ${saved.slackMessageId}`);
            return saved;
        } catch (error) {
            this.logger.error(`[saveMessage] 저장 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 메시지 전체 텍스트 검색
     */
    async searchMessages(query: string, limit: number = 50): Promise<MessageDocument[]> {
        try {
            const messages = await this.messageModel
                .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .exec();

            this.logger.log(`[searchMessages] 검색 완료: "${query}" - ${messages.length}건`);
            return messages;
        } catch (error) {
            this.logger.error(`[searchMessages] 검색 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 채널별 메시지 조회
     */
    async getMessagesByChannel(channelId: string, page: number = 1, limit: number = 50): Promise<MessageDocument[]> {
        try {
            const skip = (page - 1) * limit;
            const messages = await this.messageModel
                .find({ channelId })
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            this.logger.log(`[getMessagesByChannel] 채널 메시지 조회: ${channelId} - ${messages.length}건`);
            return messages;
        } catch (error) {
            this.logger.error(`[getMessagesByChannel] 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 사용자별 메시지 조회
     */
    async getMessagesByUser(userId: string, page: number = 1, limit: number = 50): Promise<MessageDocument[]> {
        try {
            const skip = (page - 1) * limit;
            const messages = await this.messageModel
                .find({ userId })
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            this.logger.log(`[getMessagesByUser] 사용자 메시지 조회: ${userId} - ${messages.length}건`);
            return messages;
        } catch (error) {
            this.logger.error(`[getMessagesByUser] 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 날짜 범위로 메시지 조회
     */
    async getMessagesByDateRange(startDate: Date, endDate: Date, limit: number = 100): Promise<MessageDocument[]> {
        try {
            const messages = await this.messageModel
                .find({
                    sentAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                })
                .sort({ sentAt: -1 })
                .limit(limit)
                .exec();

            this.logger.log(`[getMessagesByDateRange] 날짜 범위 조회: ${messages.length}건`);
            return messages;
        } catch (error) {
            this.logger.error(`[getMessagesByDateRange] 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 전체 메시지 개수 조회
     */
    async getTotalCount(): Promise<number> {
        return this.messageModel.countDocuments().exec();
    }

    /**
     * 채널별 메시지 개수 조회
     */
    async getCountByChannel(channelId: string): Promise<number> {
        return this.messageModel.countDocuments({ channelId }).exec();
    }

    /**
     * 메시지 전송 (중앙집중식 MVP)
     * - Slack으로 메시지 전송
     * - RelayService가 자동으로 Discord 백업
     */
    async sendMessage(user: any, requestDto: SendMessageRequestDto): Promise<SendMessageResponseDto> {
        const { teamId, content } = requestDto;

        // 1. Team 조회
        const team = await this.teamModel.findById(teamId).exec();
        if (!team) {
            throw new NotFoundException('팀을 찾을 수 없습니다.');
        }

        if (!team.slackConfig?.channelId) {
            throw new BadRequestException('Slack 채널이 설정되지 않았습니다.');
        }

        try {
            // 2. JWT 토큰에서 사용자명 가져오기
            const username = user.username || user.email?.split('@')[0] || '익명';

            // 3. Slack으로 메시지 전송 (메시지 내용에 사용자명 포함)
            const messageWithUsername = `**${username}**: ${content}`;
            const result = await this.slackService.postMessage(
                team.slackConfig.channelId,
                messageWithUsername,
                username,
            );

            this.logger.log(
                `[sendMessage] 메시지 전송 완료: Team=${teamId}, Slack=${team.slackConfig.channelId}, User=${user.userId}, Username=${username}`,
            );

            // 4. Discord로 백업 (비동기 처리 - Slack 응답 속도에 영향 없음)
            if (team.discordConfig?.webhookUrl) {
                // Fire-and-forget: Discord 백업을 기다리지 않고 즉시 응답
                this.discordService
                    .sendWebhookMessage(team.discordConfig.webhookUrl, {
                        content,
                        username,
                        avatar_url: undefined, // 필요 시 JWT에서 프로필 이미지 추가 가능
                    })
                    .then(() => {
                        this.logger.log(
                            `[sendMessage] Discord 백업 완료: Team=${teamId}, User=${username}, Content=\"${content.substring(0, 50)}...\"`,
                        );
                    })
                    .catch((discordError) => {
                        // Discord 백업 실패해도 메시지 전송은 성공으로 처리 (로그만 남김)
                        this.logger.error(
                            `[sendMessage] Discord 백업 실패 (무시): Team=${teamId}, Error=${discordError.message}`,
                        );
                    });
            } else {
                this.logger.warn(`[sendMessage] Discord Webhook URL이 설정되지 않음: Team=${teamId}`);
            }

            return {
                success: true,
                messageTs: result.messageTs,
                channelId: result.channelId,
                timestamp: result.timestamp,
            };
        } catch (error) {
            this.logger.error(`[sendMessage] 메시지 전송 실패: ${error.message}`);
            throw new BadRequestException(`메시지 전송 실패: ${error.message}`);
        }
    }

    /**
     * 메시지 조회 (중앙집중식 MVP)
     * - 90일 이내: Slack에서 조회 (빠름)
     * - 90일 이전: Discord에서 조회 (느림)
     */
    async getMessages(requestDto: GetMessagesRequestDto): Promise<GetMessagesResponseDto> {
        const { teamId, before, limit = 50 } = requestDto;

        // 1. Team 조회
        const team = await this.teamModel.findById(teamId).exec();
        if (!team) {
            throw new NotFoundException('팀을 찾을 수 없습니다.');
        }

        const now = new Date();
        const slackCutoffDate = new Date(now.getTime() - this.SLACK_RETENTION_MS); // 90일 전

        try {
            // 2. 조회 시작 날짜 결정
            const beforeDate = before ? new Date(before) : now;

            // 3-1. 90일 이내 메시지 → Slack에서 조회
            if (beforeDate >= slackCutoffDate) {
                try {
                    const oldest = (slackCutoffDate.getTime() / 1000).toString(); // Unix timestamp (초)
                    const latest = before ? (new Date(before).getTime() / 1000).toString() : undefined;

                    const slackResult = await this.slackService.getMessages(
                        team.slackConfig.channelId,
                        limit,
                        oldest,
                        latest,
                    );

                    this.logger.log(
                        `[getMessages] Slack에서 조회: Team=${teamId}, Count=${slackResult.messages.length}`,
                    );

                    return {
                        messages: slackResult.messages.map((msg) => ({
                            ...msg,
                            source: 'slack' as const,
                        })),
                        hasMore: slackResult.hasMore,
                        nextCursor: slackResult.nextCursor,
                    };
                } catch (slackError) {
                    // Slack API 권한 에러 시 빈 배열 반환 (missing_scope 등)
                    this.logger.warn(`[getMessages] Slack 조회 실패 (권한 문제일 수 있음): ${slackError.message}`);
                    return {
                        messages: [],
                        hasMore: false,
                    };
                }
            }

            // 3-2. 90일 이전 메시지 → Discord에서 조회
            else {
                if (!team.discordConfig?.channelId) {
                    throw new BadRequestException('Discord 채널이 설정되지 않았습니다.');
                }

                const discordResult = await this.discordService.getMessages(
                    team.discordConfig.channelId,
                    limit,
                    requestDto.before, // Discord는 message ID 사용
                );

                this.logger.log(
                    `[getMessages] Discord에서 조회: Team=${teamId}, Count=${discordResult.messages.length}`,
                );

                return {
                    messages: discordResult.messages.map((msg) => ({
                        ...msg,
                        source: 'discord' as const,
                    })),
                    hasMore: discordResult.hasMore,
                    nextCursor: discordResult.nextCursor,
                };
            }
        } catch (error) {
            this.logger.error(`[getMessages] 메시지 조회 실패: ${error.message}`);
            throw new BadRequestException(`메시지 조회 실패: ${error.message}`);
        }
    }
}
