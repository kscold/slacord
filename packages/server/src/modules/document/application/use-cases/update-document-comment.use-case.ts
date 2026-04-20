import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_COMMENT_REPOSITORY, type IDocumentCommentRepository } from '../../domain/document-comment.port';
import { CLOCK, type Clock } from '../../../../shared/lib/clock';

@Injectable()
export class UpdateDocumentCommentUseCase {
    constructor(
        @Inject(DOCUMENT_COMMENT_REPOSITORY)
        private readonly repo: IDocumentCommentRepository,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    async execute(input: { commentId: string; content: string }) {
        const current = await this.repo.findById(input.commentId);
        if (!current) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        if (current.isDeleted) throw new BadRequestException('삭제된 문서 코멘트는 수정할 수 없습니다.');

        const content = input.content.trim();
        if (!content) throw new BadRequestException('코멘트 내용을 입력해 주세요.');
        if (content === current.content) return current;

        const updated = await this.repo.updateContent(input.commentId, {
            content,
            editedAt: this.clock.now(),
        });
        if (!updated) throw new BadRequestException('존재하지 않는 문서 코멘트입니다.');
        return updated;
    }
}
