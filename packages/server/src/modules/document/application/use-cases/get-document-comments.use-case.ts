import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';

export type DocumentCommentStatusFilter = 'all' | 'open' | 'resolved';

@Injectable()
export class GetDocumentCommentsUseCase {
    constructor(
        @Inject(DOCUMENT_COMMENT_REPOSITORY)
        private readonly repo: IDocumentCommentRepository,
    ) {}

    async executeList(documentId: string, status: DocumentCommentStatusFilter = 'all') {
        const comments = await this.repo.findByDocument(documentId);
        if (status === 'all') return comments;

        const matchingThreadIds = new Set(
            comments
                .filter((comment) => comment.parentId === null)
                .filter((comment) => (status === 'open' ? !comment.isResolved : comment.isResolved))
                .map((comment) => comment.id),
        );

        return comments.filter((comment) => matchingThreadIds.has(resolveThreadId(comment)));
    }

    async executeOne(commentId: string) {
        const comment = await this.repo.findById(commentId);
        if (!comment) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        return comment;
    }
}

function resolveThreadId(comment: DocumentCommentEntity) {
    return comment.parentId ?? comment.id;
}
