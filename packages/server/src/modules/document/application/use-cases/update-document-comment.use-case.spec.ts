import { BadRequestException } from '@nestjs/common';
import { DocumentCommentEntity } from '../../domain/document-comment.entity';
import { UpdateDocumentCommentUseCase } from './update-document-comment.use-case';

function makeComment(
    overrides: Partial<{
        id: string;
        content: string;
        editedAt: Date | null;
        deletedAt: Date | null;
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
        overrides.editedAt ?? null,
        overrides.deletedAt ?? null,
        null,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z'),
    );
}

describe('UpdateDocumentCommentUseCase', () => {
    const mockRepo = {
        findByDocument: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        updateContent: jest.fn(),
        updateStatus: jest.fn(),
        softDelete: jest.fn(),
    };

    let useCase: UpdateDocumentCommentUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new UpdateDocumentCommentUseCase(mockRepo as any, { now: () => new Date() } as any);
    });

    it('코멘트를 수정하고 editedAt을 남긴다', async () => {
        const current = makeComment();
        const updated = makeComment({
            content: '수정된 코멘트',
            editedAt: new Date('2026-01-03T00:00:00.000Z'),
        });
        mockRepo.findById.mockResolvedValue(current);
        mockRepo.updateContent.mockResolvedValue(updated);

        const result = await useCase.execute({
            commentId: 'comment-1',
            content: '  수정된 코멘트  ',
        });

        expect(result).toBe(updated);
        expect(mockRepo.updateContent).toHaveBeenCalledWith(
            'comment-1',
            expect.objectContaining({
                content: '수정된 코멘트',
                editedAt: expect.any(Date),
            }),
        );
    });

    it('삭제된 코멘트는 수정할 수 없다', async () => {
        mockRepo.findById.mockResolvedValue(makeComment({ deletedAt: new Date('2026-01-02T00:00:00.000Z') }));

        await expect(
            useCase.execute({
                commentId: 'comment-1',
                content: '다시 수정',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
