import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';

@Injectable()
export class DeleteDocumentCommentUseCase {
    constructor(
        @Inject(DOCUMENT_COMMENT_REPOSITORY)
        private readonly repo: IDocumentCommentRepository,
    ) {}

    async execute(input: { commentId: string; deletedBy: string }) {
        const current = await this.repo.findById(input.commentId);
        if (!current) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        if (current.isDeleted) throw new BadRequestException('이미 삭제된 문서 코멘트입니다.');

        const deleted = await this.repo.softDelete(input.commentId, {
            deletedAt: new Date(),
            deletedBy: input.deletedBy,
        });
        if (!deleted) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        return deleted;
    }
}
