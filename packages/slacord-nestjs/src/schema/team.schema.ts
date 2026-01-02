import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamDocument = Team & Document;

/**
 * Team 스키마
 * - 하나의 팀은 여러 개의 Room(채널)을 가질 수 있음
 * - 각 팀은 독립적인 Slack Workspace와 Discord Server를 가짐
 */
@Schema({ timestamps: true })
export class Team {
    /**
     * 팀 이름
     */
    @Prop({ required: true, unique: true })
    name: string;

    /**
     * 팀 설명
     */
    @Prop()
    description?: string;

    /**
     * 팀장 (생성자)
     */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    ownerId: Types.ObjectId;

    /**
     * 팀 멤버 목록
     */
    @Prop({
        type: [
            {
                userId: { type: Types.ObjectId, ref: 'User' },
                role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    })
    members: {
        userId: Types.ObjectId;
        role: 'owner' | 'admin' | 'member';
        joinedAt: Date;
    }[];

    /**
     * 초대 링크 정보
     */
    @Prop({
        type: {
            token: String,
            expiresAt: Date,
            isActive: { type: Boolean, default: true },
            maxUses: Number,
            currentUses: { type: Number, default: 0 },
        },
    })
    inviteLink?: {
        token: string;
        expiresAt: Date;
        isActive: boolean;
        maxUses?: number;
        currentUses: number;
    };

    /**
     * Slack Channel 정보 (중앙집중식 MVP)
     * - Slacord 공식 Workspace에 자동 생성된 채널 정보
     */
    @Prop({
        type: {
            channelId: String, // Slack 채널 ID (예: C12345678)
            channelName: String, // Slack 채널 이름
            workspaceName: { type: String, default: 'Slacord Official' }, // 고정된 Slacord 워크스페이스
        },
        required: true,
    })
    slackConfig: {
        channelId: string;
        channelName: string;
        workspaceName: string;
    };

    /**
     * Discord Channel 정보 (중앙집중식 MVP)
     * - Slacord 공식 Server에 자동 생성된 채널 정보
     */
    @Prop({
        type: {
            channelId: String, // Discord 채널 ID
            channelName: String, // Discord 채널 이름
            webhookUrl: String, // Discord 채널 전용 Webhook URL
            serverName: { type: String, default: 'Slacord Official' }, // 고정된 Slacord 서버
        },
        required: true,
    })
    discordConfig: {
        channelId: string;
        channelName: string;
        webhookUrl: string;
        serverName: string;
    };

    /**
     * 팀 활성화 상태
     */
    @Prop({ default: true })
    isActive: boolean;

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

export const TeamSchema = SchemaFactory.createForClass(Team);

// 인덱스 설정
TeamSchema.index({ name: 1 }, { unique: true });
TeamSchema.index({ isActive: 1 });
