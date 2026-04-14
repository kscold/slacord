import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChannelReadDocument = ChannelRead & Document;

@Schema({ timestamps: true, collection: 'channel_reads' })
export class ChannelRead {
    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true, index: true })
    channelId: string;

    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    lastReadAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

export const ChannelReadSchema = SchemaFactory.createForClass(ChannelRead);

ChannelReadSchema.index({ channelId: 1, userId: 1 }, { unique: true });
ChannelReadSchema.index({ teamId: 1, userId: 1, updatedAt: -1 });
