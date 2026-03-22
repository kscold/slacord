import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true, collection: 'announcements' })
export class Announcement {
    static readonly name = 'Announcement';

    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: false })
    isPinned: boolean;

    @Prop({ required: true })
    createdBy: string;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// 핀 고정된 공지 먼저, 최신 순 정렬을 위한 복합 인덱스
AnnouncementSchema.index({ teamId: 1, isPinned: -1, createdAt: -1 });
