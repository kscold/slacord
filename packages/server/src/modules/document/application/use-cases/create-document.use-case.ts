import { Inject, Injectable } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';
import type { IDocumentVersionRepository } from '../../domain/document-version.port';
import { DOCUMENT_VERSION_REPOSITORY } from '../../domain/document-version.port';

@Injectable()
export class CreateDocumentUseCase {
    constructor(
        @Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository,
        @Inject(DOCUMENT_VERSION_REPOSITORY) private readonly versionRepo: IDocumentVersionRepository,
    ) {}

    async execute(data: {
        teamId: string;
        title: string;
        content: string;
        contentFormat?: 'plain' | 'html' | 'json';
        parentId: string | null;
        createdBy: string;
    }): Promise<DocumentEntity> {
        const doc = await this.repo.save(data);
        await this.versionRepo.save({
            documentId: doc.id,
            teamId: doc.teamId,
            title: doc.title,
            content: doc.content,
            contentFormat: doc.contentFormat,
            savedBy: data.createdBy,
        });
        return doc;
    }
}
