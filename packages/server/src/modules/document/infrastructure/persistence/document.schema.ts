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

    @Prop({ default: null })
    parentId: string | null;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ required: true })
    updatedBy: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Doc);

// 팀별 문서 조회를 위한 인덱스
DocumentSchema.index({ teamId: 1, parentId: 1 });
