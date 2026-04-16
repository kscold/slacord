import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentCommentEntity } from '../../domain/document-comment.entity';
import type { IDocumentCommentRepository } from '../../domain/document-comment.port';
import { DocComment, type DocumentCommentDocument } from './document-comment.schema';

@Injectable()
export class DocumentCommentRepository implements IDocumentCommentRepository {
    constructor(@InjectModel(DocComment.name) private readonly model: Model<DocumentCommentDocument>) {}

    private toEntity(doc: DocumentCommentDocument): DocumentCommentEntity {
        return new DocumentCommentEntity(
            (doc._id as any).toString(),
            doc.teamId,
            doc.documentId,
            doc.parentId ?? null,
            doc.content,
            doc.anchorText ?? null,
            doc.createdBy,
            doc.resolvedAt ?? null,
            doc.resolvedBy ?? null,
            (doc as any).createdAt,
            (doc as any).updatedAt,
        );
    }

    async findByDocument(documentId: string): Promise<DocumentCommentEntity[]> {
        const docs = await this.model.find({ documentId }).sort({ createdAt: 1 }).lean();
        return docs.map((doc) => this.toEntity(doc as DocumentCommentDocument));
    }

    async findById(id: string): Promise<DocumentCommentEntity | null> {
        const doc = await this.model.findById(id).lean();
        return doc ? this.toEntity(doc as DocumentCommentDocument) : null;
    }

    async save(data: {
        teamId: string;
        documentId: string;
        parentId: string | null;
        content: string;
        anchorText: string | null;
        createdBy: string;
    }): Promise<DocumentCommentEntity> {
        const doc = await this.model.create(data);
        return this.toEntity(doc);
    }

    async updateStatus(id: string, data: { resolvedAt: Date | null; resolvedBy: string | null }): Promise<DocumentCommentEntity | null> {
        const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        return doc ? this.toEntity(doc as DocumentCommentDocument) : null;
    }
}
