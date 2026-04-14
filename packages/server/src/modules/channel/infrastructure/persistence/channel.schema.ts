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

    @Prop({ required: true, enum: ['public', 'private', 'dm', 'group', 'voice'], default: 'public' })
    type: string;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ type: [String], default: [] })
    memberIds: string[];

    @Prop({ type: String, default: null })
    externalSource: string | null;

    @Prop({ type: String, default: null })
    externalId: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
ChannelSchema.index(
    { teamId: 1, name: 1 },
    { unique: true, partialFilterExpression: { type: { $in: ['public', 'private', 'voice'] } } },
);
ChannelSchema.index(
    { teamId: 1, externalSource: 1, externalId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            externalSource: { $type: 'string' },
            externalId: { $type: 'string' },
        },
    },
);
