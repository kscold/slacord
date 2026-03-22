import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IDocumentRepository } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';
import { DocumentEntity as Entity } from '../../domain/document.entity';
import { Doc, type DocumentDocument } from './document.schema';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
    constructor(@InjectModel(Doc.name) private readonly model: Model<DocumentDocument>) {}

    private toEntity(doc: DocumentDocument): DocumentEntity {
        return new Entity(
            (doc._id as any).toString(),
            doc.teamId,
            doc.title,
            doc.content,
            doc.parentId,
            doc.createdBy,
            doc.updatedBy,
            (doc as any).createdAt,
            (doc as any).updatedAt,
        );
    }

    async findByTeam(teamId: string): Promise<DocumentEntity[]> {
        const docs = await this.model.find({ teamId }).sort({ parentId: 1, createdAt: 1 }).lean();
        return docs.map((d) => this.toEntity(d as DocumentDocument));
    }

    async findById(id: string): Promise<DocumentEntity | null> {
        const doc = await this.model.findById(id).lean();
        return doc ? this.toEntity(doc as DocumentDocument) : null;
    }

    async save(data: {
        teamId: string;
        title: string;
        content: string;
        parentId: string | null;
        createdBy: string;
    }): Promise<DocumentEntity> {
        const doc = await this.model.create({ ...data, updatedBy: data.createdBy });
        return this.toEntity(doc);
    }

    async update(id: string, data: { title?: string; content?: string; updatedBy: string }): Promise<DocumentEntity | null> {
        const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        return doc ? this.toEntity(doc as DocumentDocument) : null;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id);
        return result !== null;
    }
}
