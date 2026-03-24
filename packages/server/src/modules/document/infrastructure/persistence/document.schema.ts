import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentDocument = Doc & Document;

@Schema({ timestamps: true, collection: 'documents' })
export class Doc {
    static readonly name = 'Document';

    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    content: string;

    @Prop({ type: String, enum: ['plain', 'html'], default: 'plain' })
    contentFormat: 'plain' | 'html';

    @Prop({ type: String, default: null })
    parentId: string | null;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ required: true })
    updatedBy: string;

    @Prop({ type: String, default: null })
    externalSource: string | null;

    @Prop({ type: String, default: null })
    externalId: string | null;

    @Prop({ type: String, default: null })
    externalUrl: string | null;
}

export const DocumentSchema = SchemaFactory.createForClass(Doc);

// 팀별 문서 조회를 위한 인덱스
DocumentSchema.index({ teamId: 1, parentId: 1 });
DocumentSchema.index({ teamId: 1, externalSource: 1, externalId: 1 });
