import { BadRequestException } from '@nestjs/common';
import { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { GetDocumentCommentsUseCase } from './get-document-comments.use-case';

function makeComment(
    overrides: Partial<{
        id: string;
        teamId: string;
        documentId: string;
        parentId: string | null;
        resolvedAt: Date | null;
        deletedAt: Date | null;
    }> = {},
) {
    return new DocumentCommentEntity(
        overrides.id ?? 'comment-1',
        overrides.teamId ?? 'team-1',
        overrides.documentId ?? 'doc-1',
        overrides.parentId ?? null,
        '코멘트',
        null,
        'user-1',
        overrides.resolvedAt ?? null,
        null,
        null,
        overrides.deletedAt ?? null,
        null,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z'),
    );
}

describe('GetDocumentCommentsUseCase', () => {
    const mockRepo = {
        findByDocument: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        updateContent: jest.fn(),
        updateStatus: jest.fn(),
        softDelete: jest.fn(),
    };

    let useCase: GetDocumentCommentsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetDocumentCommentsUseCase(mockRepo as any);
    });

    it('열린 토론 필터는 미해결 스레드와 해당 답글만 반환한다', async () => {
        const openRoot = makeComment({ id: 'root-open' });
        const openReply = makeComment({ id: 'reply-open', parentId: 'root-open' });
        const resolvedRoot = makeComment({ id: 'root-resolved', resolvedAt: new Date('2026-01-02T00:00:00.000Z') });
        const resolvedReply = makeComment({ id: 'reply-resolved', parentId: 'root-resolved' });
        mockRepo.findByDocument.mockResolvedValue([openRoot, openReply, resolvedRoot, resolvedReply]);

        const result = await useCase.executeList('doc-1', 'open');

        expect(result.map((comment) => comment.id)).toEqual(['root-open', 'reply-open']);
    });

    it('해결된 토론 필터는 해결된 스레드와 해당 답글만 반환한다', async () => {
        const openRoot = makeComment({ id: 'root-open' });
        const resolvedRoot = makeComment({ id: 'root-resolved', resolvedAt: new Date('2026-01-02T00:00:00.000Z') });
        const resolvedReply = makeComment({ id: 'reply-resolved', parentId: 'root-resolved' });
        mockRepo.findByDocument.mockResolvedValue([openRoot, resolvedRoot, resolvedReply]);

        const result = await useCase.executeList('doc-1', 'resolved');

        expect(result.map((comment) => comment.id)).toEqual(['root-resolved', 'reply-resolved']);
    });

    it('존재하지 않는 코멘트를 조회하면 실패한다', async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(useCase.executeOne('missing-comment')).rejects.toThrow(BadRequestException);
    });
});
