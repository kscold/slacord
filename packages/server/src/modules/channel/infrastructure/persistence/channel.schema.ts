import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChannelDocument = Channel & Document;

/** 채팅 채널 MongoDB 스키마 */
@Schema({ timestamps: true, collection: 'channels' })
export class Channel {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Team', index: true })
    teamId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ type: String, default: null })
    description: string | null;

    @Prop({ required: true, enum: ['public', 'private'], default: 'public' })
    type: string;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ type: [String], default: [] })
    memberIds: string[];

    createdAt: Date;
    updatedAt: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
ChannelSchema.index({ teamId: 1, name: 1 }, { unique: true });
