import { BadRequestException } from '@nestjs/common';
import { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { DeleteDocumentCommentUseCase } from './delete-document-comment.use-case';

function makeComment(
    overrides: Partial<{
        id: string;
        deletedAt: Date | null;
        deletedBy: string | null;
        content: string;
    }> = {},
) {
    return new DocumentCommentEntity(
        overrides.id ?? 'comment-1',
        'team-1',
        'doc-1',
        null,
        overrides.content ?? '기존 코멘트',
        null,
        'user-1',
        null,
        null,
        null,
        overrides.deletedAt ?? null,
        overrides.deletedBy ?? null,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z'),
    );
}

describe('DeleteDocumentCommentUseCase', () => {
    const mockRepo = {
        findByDocument: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        updateContent: jest.fn(),
        updateStatus: jest.fn(),
        softDelete: jest.fn(),
    };

    let useCase: DeleteDocumentCommentUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new DeleteDocumentCommentUseCase(mockRepo as any, { now: () => new Date() } as any);
    });

    it('코멘트를 soft delete 한다', async () => {
        const current = makeComment();
        const deleted = makeComment({
            content: '',
            deletedAt: new Date('2026-01-03T00:00:00.000Z'),
            deletedBy: 'user-2',
        });
        mockRepo.findById.mockResolvedValue(current);
        mockRepo.softDelete.mockResolvedValue(deleted);

        const result = await useCase.execute({
            commentId: 'comment-1',
            deletedBy: 'user-2',
        });

        expect(result).toBe(deleted);
        expect(mockRepo.softDelete).toHaveBeenCalledWith(
            'comment-1',
            expect.objectContaining({
                deletedAt: expect.any(Date),
                deletedBy: 'user-2',
            }),
        );
    });

    it('이미 삭제된 코멘트는 다시 삭제할 수 없다', async () => {
        mockRepo.findById.mockResolvedValue(
            makeComment({ deletedAt: new Date('2026-01-02T00:00:00.000Z'), deletedBy: 'user-2' }),
        );

        await expect(
            useCase.execute({
                commentId: 'comment-1',
                deletedBy: 'user-2',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
