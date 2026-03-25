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
            doc.contentFormat ?? 'plain',
            doc.parentId,
            doc.createdBy,
            doc.updatedBy,
            doc.externalSource ?? null,
            doc.externalId ?? null,
            doc.externalUrl ?? null,
            (doc as any).visibility ?? 'team',
            (doc as any).editPolicy ?? 'all',
            (doc as any).allowedViewerIds ?? [],
            (doc as any).allowedEditorIds ?? [],
            (doc as any).archivedAt ?? null,
            (doc as any).archivedBy ?? null,
            (doc as any).createdAt,
            (doc as any).updatedAt,
        );
    }

    async findByTeam(teamId: string, includeArchived = false): Promise<DocumentEntity[]> {
        const filter: Record<string, unknown> = { teamId };
        if (!includeArchived) filter.archivedAt = null;
        const docs = await this.model.find(filter).sort({ parentId: 1, createdAt: 1 }).lean();
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
        contentFormat?: 'plain' | 'html' | 'json';
        parentId: string | null;
        createdBy: string;
    }): Promise<DocumentEntity> {
        const doc = await this.model.create({ ...data, contentFormat: data.contentFormat ?? 'plain', updatedBy: data.createdBy });
        return this.toEntity(doc);
    }

    async upsertExternal(data: {
        teamId: string;
        title: string;
        content: string;
        contentFormat: 'plain' | 'html' | 'json';
        parentId: string | null;
        createdBy: string;
        updatedBy: string;
        externalSource: string;
        externalId: string;
        externalUrl: string | null;
    }): Promise<DocumentEntity> {
        const doc = await this.model.findOneAndUpdate(
            { teamId: data.teamId, externalSource: data.externalSource, externalId: data.externalId },
            {
                $set: {
                    title: data.title,
                    content: data.content,
                    contentFormat: data.contentFormat,
                    parentId: data.parentId,
                    updatedBy: data.updatedBy,
                    externalUrl: data.externalUrl,
                },
                $setOnInsert: {
                    teamId: data.teamId,
                    createdBy: data.createdBy,
                    externalSource: data.externalSource,
                    externalId: data.externalId,
                },
            },
            { new: true, upsert: true },
        ).lean();
        return this.toEntity(doc as DocumentDocument);
    }

    async update(id: string, data: { title?: string; content?: string; contentFormat?: 'plain' | 'html' | 'json'; updatedBy: string; visibility?: 'team' | 'restricted'; editPolicy?: 'owner_admin' | 'all' | 'restricted'; allowedViewerIds?: string[]; allowedEditorIds?: string[] }): Promise<DocumentEntity | null> {
        const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        return doc ? this.toEntity(doc as DocumentDocument) : null;
    }

    async archiveById(id: string, archivedBy: string): Promise<DocumentEntity | null> {
        const doc = await this.model.findByIdAndUpdate(id, { $set: { archivedAt: new Date(), archivedBy } }, { new: true }).lean();
        return doc ? this.toEntity(doc as DocumentDocument) : null;
    }

    async restoreById(id: string): Promise<DocumentEntity | null> {
        const doc = await this.model.findByIdAndUpdate(id, { $set: { archivedAt: null, archivedBy: null } }, { new: true }).lean();
        return doc ? this.toEntity(doc as DocumentDocument) : null;
    }

    async archiveByParentId(parentId: string, archivedBy: string): Promise<number> {
        const result = await this.model.updateMany({ parentId, archivedAt: null }, { $set: { archivedAt: new Date(), archivedBy } });
        return result.modifiedCount;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id);
        return result !== null;
    }
}
