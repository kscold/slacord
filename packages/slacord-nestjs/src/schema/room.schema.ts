import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

/**
 * Room 스키마
 * - Slack 채널과 Discord 채널을 1:1 매핑
 * - 각 Room은 하나의 Team에 속함
 */
@Schema({ timestamps: true })
export class Room {
    /**
     * 소속 팀 ID
     */
    @Prop({ type: Types.ObjectId, ref: 'Team', required: true, index: true })
    teamId: Types.ObjectId;

    /**
     * Room 이름
     */
    @Prop({ required: true })
    name: string;

    /**
     * Room 설명
     */
    @Prop()
    description?: string;

    /**
     * Slack 채널 정보
     */
    @Prop({
        type: {
            channelId: String,
            channelName: String,
        },
        required: true,
    })
    slackChannel: {
        channelId: string;
        channelName: string;
    };

    /**
     * Discord 채널 정보
     */
    @Prop({
        type: {
            channelId: String,
            channelName: String,
            webhookUrl: String,
        },
        required: true,
    })
    discordChannel: {
        channelId: string;
        channelName: string;
        webhookUrl: string;
    };

    /**
     * Room 활성화 상태
     */
    @Prop({ default: true })
    isActive: boolean;

    /**
     * 총 백업된 메시지 수
     */
    @Prop({ default: 0 })
    messageCount: number;

    /**
     * 마지막 백업 시각
     */
    @Prop()
    lastBackupAt?: Date;

    /**
     * 생성 시각
     */
    @Prop({ default: Date.now })
    createdAt: Date;

    /**
     * 수정 시각
     */
    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// 인덱스 설정
RoomSchema.index({ teamId: 1, name: 1 }, { unique: true });
RoomSchema.index({ 'slackChannel.channelId': 1 }, { unique: true });
RoomSchema.index({ isActive: 1 });
