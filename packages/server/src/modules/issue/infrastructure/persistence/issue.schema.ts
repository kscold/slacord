import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IssueDocument = Issue & Document;

/** 이슈 트래커 MongoDB 스키마 */
@Schema({ timestamps: true, collection: 'issues' })
export class Issue {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Team', index: true })
    teamId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ required: true, enum: ['todo', 'in_progress', 'in_review', 'done'], default: 'todo', index: true })
    status: string;

    @Prop({ required: true, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
    priority: string;

    @Prop({ type: [String], default: [] })
    assigneeIds: string[];

    @Prop({ type: [String], default: [] })
    labels: string[];

    @Prop({ required: true })
    createdBy: string;

    createdAt: Date;
    updatedAt: Date;
}

export const IssueSchema = SchemaFactory.createForClass(Issue);
IssueSchema.index({ teamId: 1, status: 1 });
