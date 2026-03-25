import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentVersionDocument = DocVersion & Document;

@Schema({ timestamps: true, collection: 'document_versions' })
export class DocVersion {
    static readonly name = 'DocumentVersion';

    @Prop({ required: true, index: true })
    documentId: string;

    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    content: string;

    @Prop({ type: String, enum: ['plain', 'html', 'json'], default: 'plain' })
    contentFormat: 'plain' | 'html' | 'json';

    @Prop({ required: true })
    savedBy: string;
}

export const DocumentVersionSchema = SchemaFactory.createForClass(DocVersion);

DocumentVersionSchema.index({ documentId: 1, createdAt: -1 });
