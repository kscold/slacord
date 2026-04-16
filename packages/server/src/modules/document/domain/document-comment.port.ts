import type { DocumentCommentEntity } from './document-comment.entity';

export interface IDocumentCommentRepository {
    findByDocument(documentId: string): Promise<DocumentCommentEntity[]>;
    findById(id: string): Promise<DocumentCommentEntity | null>;
    save(data: {
        teamId: string;
        documentId: string;
        parentId: string | null;
        content: string;
        anchorText: string | null;
        createdBy: string;
    }): Promise<DocumentCommentEntity>;
    updateStatus(id: string, data: { resolvedAt: Date | null; resolvedBy: string | null }): Promise<DocumentCommentEntity | null>;
}

export const DOCUMENT_COMMENT_REPOSITORY = Symbol('DOCUMENT_COMMENT_REPOSITORY');
