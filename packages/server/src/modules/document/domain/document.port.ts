import type { DocumentEntity } from './document.entity';

/** 문서/위키 레포지토리 포트 */
export interface IDocumentRepository {
    findByTeam(teamId: string): Promise<DocumentEntity[]>;
    findById(id: string): Promise<DocumentEntity | null>;
    save(data: {
        teamId: string;
        title: string;
        content: string;
        contentFormat?: 'plain' | 'html';
        parentId: string | null;
        createdBy: string;
    }): Promise<DocumentEntity>;
    upsertExternal(data: {
        teamId: string;
        title: string;
        content: string;
        contentFormat: 'plain' | 'html';
        parentId: string | null;
        createdBy: string;
        updatedBy: string;
        externalSource: string;
        externalId: string;
        externalUrl: string | null;
    }): Promise<DocumentEntity>;
    update(id: string, data: { title?: string; content?: string; contentFormat?: 'plain' | 'html'; updatedBy: string }): Promise<DocumentEntity | null>;
    deleteById(id: string): Promise<boolean>;
}

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');
