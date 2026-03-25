import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IDocumentVersionRepository } from '../../domain/document-version.port';
import { DocumentVersionEntity } from '../../domain/document-version.entity';
import { DocVersion, type DocumentVersionDocument } from './document-version.schema';

@Injectable()
export class DocumentVersionRepository implements IDocumentVersionRepository {
    constructor(@InjectModel(DocVersion.name) private readonly model: Model<DocumentVersionDocument>) {}

    private toEntity(doc: DocumentVersionDocument) {
        return new DocumentVersionEntity(
            (doc._id as any).toString(),
            doc.documentId,
            doc.teamId,
            doc.title,
            doc.content,
            doc.contentFormat ?? 'plain',
            doc.savedBy,
            (doc as any).createdAt,
        );
    }

    async save(data: { documentId: string; teamId: string; title: string; content: string; contentFormat: 'plain' | 'html' | 'json'; savedBy: string }) {
        const version = await this.model.create(data);
        return this.toEntity(version);
    }

    async findByDocument(documentId: string) {
        const docs = await this.model.find({ documentId }).sort({ createdAt: -1 }).lean();
        return docs.map((doc) => this.toEntity(doc as DocumentVersionDocument));
    }

    async findById(id: string) {
        const doc = await this.model.findById(id).lean();
        return doc ? this.toEntity(doc as DocumentVersionDocument) : null;
    }
}
