import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BridgeJobDocument = BridgeJob & Document;

@Schema({ timestamps: true, collection: 'bridge_jobs' })
export class BridgeJob {
    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true, enum: ['slack', 'discord'], index: true })
    platform: string;

    @Prop({ required: true, enum: ['announcement', 'github'] })
    eventType: string;

    @Prop({ required: true })
    webhookUrl: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true, default: '' })
    content: string;

    @Prop({ type: String, default: null })
    url: string | null;

    @Prop({ required: true, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending', index: true })
    status: string;

    @Prop({ required: true, default: 0 })
    attemptCount: number;

    @Prop({ required: true, default: () => new Date(), index: true })
    availableAt: Date;

    @Prop({ type: Date, default: null })
    claimedAt: Date | null;

    @Prop({ type: Date, default: null })
    deliveredAt: Date | null;

    @Prop({ type: String, default: null })
    lastError: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export const BridgeJobSchema = SchemaFactory.createForClass(BridgeJob);
