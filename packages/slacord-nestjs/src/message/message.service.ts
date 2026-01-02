import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';

/**
 * 메시지 저장 및 검색 서비스
 */
@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

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
}
