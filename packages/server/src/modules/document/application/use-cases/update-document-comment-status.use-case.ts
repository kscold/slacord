import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';

@Injectable()
export class UpdateDocumentCommentStatusUseCase {
    constructor(
        @Inject(DOCUMENT_COMMENT_REPOSITORY)
        private readonly repo: IDocumentCommentRepository,
    ) {}

    async execute(input: { commentId: string; resolved: boolean; actorId: string }) {
        const comment = await this.repo.updateStatus(input.commentId, {
            resolvedAt: input.resolved ? new Date() : null,
            resolvedBy: input.resolved ? input.actorId : null,
        });
        if (!comment) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        return comment;
    }
}
