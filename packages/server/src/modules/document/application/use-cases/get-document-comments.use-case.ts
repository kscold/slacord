import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';

@Injectable()
export class GetDocumentCommentsUseCase {
    constructor(
        @Inject(DOCUMENT_COMMENT_REPOSITORY)
        private readonly repo: IDocumentCommentRepository,
    ) {}

    async executeList(documentId: string) {
        return this.repo.findByDocument(documentId);
    }

    async executeOne(commentId: string) {
        const comment = await this.repo.findById(commentId);
        if (!comment) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        return comment;
    }
}
