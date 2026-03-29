import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true, index: true })
    recipientId: string;

    @Prop({ required: true, enum: ['mention', 'issue_assigned', 'issue_updated', 'thread_reply'] })
    type: string;

    @Prop({ required: true })
    actorId: string;

    @Prop({ required: true })
    actorName: string;

    @Prop({ required: true })
    content: string;

    @Prop({ required: true, enum: ['message', 'issue'] })
    resourceType: string;

    @Prop({ required: true })
    resourceId: string;

    @Prop({ type: String, default: null })
    channelId: string | null;

    @Prop({ default: false, index: true })
    isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ teamId: 1, recipientId: 1, createdAt: -1 });
