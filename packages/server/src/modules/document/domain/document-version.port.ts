import type { DocumentVersionEntity } from './document-version.entity';

export interface IDocumentVersionRepository {
    save(data: {
        documentId: string;
        teamId: string;
        title: string;
        content: string;
        contentFormat: 'plain' | 'html' | 'json';
        savedBy: string;
    }): Promise<DocumentVersionEntity>;
    findByDocument(documentId: string): Promise<DocumentVersionEntity[]>;
    findById(id: string): Promise<DocumentVersionEntity | null>;
}

export const DOCUMENT_VERSION_REPOSITORY = Symbol('DOCUMENT_VERSION_REPOSITORY');
