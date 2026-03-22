import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ _id: false })
class AttachmentSchema {
    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    size: number;

    @Prop({ required: true })
    mimeType: string;
}

const AttachmentSchemaFactory = SchemaFactory.createForClass(AttachmentSchema);

/** 순수 채팅 메시지 MongoDB 스키마 - Slack/Discord 의존성 없음 */
@Schema({ timestamps: true, collection: 'messages' })
export class Message {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Team', index: true })
    teamId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Channel', index: true })
    channelId: Types.ObjectId;

    @Prop({ required: true, index: true })
    authorId: string;

    @Prop({ required: true })
    content: string;

    @Prop({ required: true, enum: ['text', 'file', 'system'], default: 'text' })
    type: string;

    @Prop({ type: [AttachmentSchemaFactory], default: [] })
    attachments: AttachmentSchema[];

    @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
    replyToId: Types.ObjectId | null;

    createdAt: Date;
    updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ channelId: 1, createdAt: -1 });
