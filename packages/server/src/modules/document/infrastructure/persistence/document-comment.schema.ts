import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentCommentDocument = DocComment & Document;

@Schema({ timestamps: true, collection: 'documentComments' })
export class DocComment {
    static readonly name = 'DocumentComment';

    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true, index: true })
    documentId: string;

    @Prop({ type: String, default: null, index: true })
    parentId: string | null;

    @Prop({ required: true })
    content: string;

    @Prop({ type: String, default: null })
    anchorText: string | null;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ type: Date, default: null })
    resolvedAt: Date | null;

    @Prop({ type: String, default: null })
    resolvedBy: string | null;

    @Prop({ type: Date, default: null })
    editedAt: Date | null;

    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    @Prop({ type: String, default: null })
    deletedBy: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export const DocumentCommentSchema = SchemaFactory.createForClass(DocComment);

DocumentCommentSchema.index({ documentId: 1, createdAt: 1 });
DocumentCommentSchema.index({ teamId: 1, documentId: 1, parentId: 1, createdAt: 1 });
