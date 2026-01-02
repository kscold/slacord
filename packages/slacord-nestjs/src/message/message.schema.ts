import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

/**
 * Slack 메시지 저장 스키마
 * Discord로 백업된 메시지를 검색 가능하도록 MongoDB에 저장
 */
@Schema({ timestamps: true })
export class Message {
    /**
     * Slack 메시지 고유 ID (ts 값)
     */
    @Prop({ required: true, unique: true, index: true })
    slackMessageId: string;

    /**
     * Slack 채널 ID
     */
    @Prop({ required: true, index: true })
    channelId: string;

    /**
     * Slack 채널명
     */
    @Prop({ required: true })
    channelName: string;

    /**
     * 메시지 작성자 Slack User ID
     */
    @Prop({ required: true, index: true })
    userId: string;

    /**
     * 메시지 작성자 이름
     */
    @Prop({ required: true })
    username: string;

    /**
     * 메시지 내용
     */
    @Prop({ required: true, index: 'text' }) // 전체 텍스트 검색 인덱스
    text: string;

    /**
     * 첨부 파일 URL 목록
     */
    @Prop({ type: [String], default: [] })
    fileUrls: string[];

    /**
     * Discord Webhook으로 전송된 메시지 ID
     */
    @Prop()
    discordMessageId?: string;

    /**
     * 메시지가 전송된 시각 (Slack 타임스탬프)
     */
    @Prop({ required: true, index: true })
    sentAt: Date;

    /**
     * Discord로 백업된 시각
     */
    @Prop({ default: Date.now })
    backedUpAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// 복합 인덱스 설정
MessageSchema.index({ channelId: 1, sentAt: -1 }); // 채널별 최신순 조회
MessageSchema.index({ userId: 1, sentAt: -1 }); // 사용자별 최신순 조회
