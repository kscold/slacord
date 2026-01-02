import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

/**
 * Message Schema (중앙집중식 MVP)
 * - Slack에서 받은 메시지를 MongoDB에 저장
 * - Discord로 자동 백업
 * - 90일 제한 없는 영구 보관
 */
@Schema({ timestamps: true })
export class Message {
    /**
     * 팀(채널) ID - Team 스키마 참조
     */
    @Prop({ type: Types.ObjectId, ref: 'Team', required: true, index: true })
    teamId: Types.ObjectId;

    /**
     * Slack 메시지 고유 ID (ts 값)
     */
    @Prop({ required: true, unique: true, index: true })
    slackMessageId: string;

    /**
     * Slack 채널 ID
     */
    @Prop({ required: true, index: true })
    slackChannelId: string;

    /**
     * Slack 채널명
     */
    @Prop({ required: true })
    slackChannelName: string;

    /**
     * 메시지 작성자 Slack User ID
     */
    @Prop({ required: true, index: true })
    slackUserId: string;

    /**
     * 메시지 작성자 이름
     */
    @Prop({ required: true })
    username: string;

    /**
     * 메시지 작성자 프로필 이미지
     */
    @Prop()
    userIcon?: string;

    /**
     * 메시지 내용
     */
    @Prop({ required: true, index: 'text' }) // 전체 텍스트 검색 인덱스
    content: string;

    /**
     * 메시지 타입
     * - message: 일반 메시지
     * - thread_reply: 스레드 답글
     * - file_share: 파일 공유
     */
    @Prop({
        type: String,
        enum: ['message', 'thread_reply', 'file_share'],
        default: 'message',
    })
    type: string;

    /**
     * 스레드 부모 메시지 TS (스레드 답글인 경우)
     */
    @Prop()
    threadTs?: string;

    /**
     * 첨부 파일 정보
     */
    @Prop({
        type: [
            {
                fileName: { type: String },
                fileUrl: { type: String },
                fileType: { type: String },
                fileSize: { type: Number },
            },
        ],
        default: [],
    })
    attachments: Array<{
        fileName?: string;
        fileUrl?: string;
        fileType?: string;
        fileSize?: number;
    }>;

    /**
     * Discord 채널 ID
     */
    @Prop({ required: true })
    discordChannelId: string;

    /**
     * Discord Webhook으로 전송된 메시지 ID
     */
    @Prop()
    discordMessageId?: string;

    /**
     * Discord Webhook URL
     */
    @Prop({ required: true })
    discordWebhookUrl: string;

    /**
     * 메시지가 전송된 시각 (Slack 타임스탬프)
     */
    @Prop({ required: true, index: true })
    sentAt: Date;

    /**
     * Discord로 백업된 시각
     */
    @Prop()
    backedUpAt?: Date;

    /**
     * MongoDB 생성 시각
     */
    createdAt?: Date;

    /**
     * MongoDB 수정 시각
     */
    updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// 복합 인덱스 설정
MessageSchema.index({ teamId: 1, sentAt: -1 }); // 팀별 최신순 조회
MessageSchema.index({ slackChannelId: 1, sentAt: -1 }); // 채널별 최신순 조회
MessageSchema.index({ slackUserId: 1, sentAt: -1 }); // 사용자별 최신순 조회
MessageSchema.index({ threadTs: 1, sentAt: 1 }); // 스레드 답글 조회
