import { BadRequestException } from '@nestjs/common';
import { ArchiveDocumentUseCase } from './archive-document.use-case';
import { DocumentEntity } from '../../domain/document.entity';

function makeDoc(id: string, parentId: string | null = null, archived = false): DocumentEntity {
    return new DocumentEntity(
        id,
        'team-1',
        `문서 ${id}`,
        '',
        'plain',
        parentId,
        'user-1',
        'user-1',
        null,
        null,
        null,
        'team',
        'owner_admin',
        [],
        [],
        archived ? new Date() : null,
        archived ? 'user-1' : null,
        new Date(),
        new Date(),
    );
}

describe('ArchiveDocumentUseCase', () => {
    const mockRepo = {
        findByTeam: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        upsertExternal: jest.fn(),
        archiveById: jest.fn(),
        restoreById: jest.fn(),
        archiveByParentId: jest.fn(),
        deleteById: jest.fn(),
    };

    let useCase: ArchiveDocumentUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ArchiveDocumentUseCase(mockRepo as any);
    });

    it('루트 문서를 정상 아카이브함', async () => {
        const root = makeDoc('doc-1');
        const archivedRoot = makeDoc('doc-1', null, true);

        mockRepo.findById.mockResolvedValue(root);
        mockRepo.archiveById.mockResolvedValueOnce(archivedRoot);
        mockRepo.findByTeam.mockResolvedValue([root]);

        const result = await useCase.execute('doc-1', 'user-1');

        expect(result.isArchived).toBe(true);
        expect(mockRepo.archiveById).toHaveBeenCalledTimes(1);
        expect(mockRepo.archiveById).toHaveBeenCalledWith('doc-1', 'user-1');
    });

    it('하위 문서와 손자 문서까지 재귀 아카이브함', async () => {
        const root = makeDoc('parent');
        const child1 = makeDoc('child-1', 'parent');
        const child2 = makeDoc('child-2', 'parent');
        const grandChild = makeDoc('grand-child', 'child-1');
        const archivedRoot = makeDoc('parent', null, true);

        mockRepo.findById.mockResolvedValue(root);
        mockRepo.archiveById
            .mockResolvedValueOnce(archivedRoot)
            .mockResolvedValueOnce(makeDoc('child-1', 'parent', true))
            .mockResolvedValueOnce(makeDoc('child-2', 'parent', true))
            .mockResolvedValueOnce(makeDoc('grand-child', 'child-1', true));
        mockRepo.findByTeam.mockResolvedValue([root, child1, child2, grandChild]);

        await useCase.execute('parent', 'user-1');

        expect(mockRepo.archiveById).toHaveBeenNthCalledWith(1, 'parent', 'user-1');
        expect(mockRepo.archiveById).toHaveBeenNthCalledWith(2, 'child-1', 'user-1');
        expect(mockRepo.archiveById).toHaveBeenNthCalledWith(3, 'child-2', 'user-1');
        expect(mockRepo.archiveById).toHaveBeenNthCalledWith(4, 'grand-child', 'user-1');
    });

    it('이미 아카이브된 하위 문서는 건너뜀', async () => {
        const root = makeDoc('parent');
        const activeChild = makeDoc('child-1', 'parent');
        const archivedChild = makeDoc('child-2', 'parent', true);

        mockRepo.findById.mockResolvedValue(root);
        mockRepo.archiveById
            .mockResolvedValueOnce(makeDoc('parent', null, true))
            .mockResolvedValueOnce(makeDoc('child-1', 'parent', true));
        mockRepo.findByTeam.mockResolvedValue([root, activeChild, archivedChild]);

        await useCase.execute('parent', 'user-1');

        expect(mockRepo.archiveById).toHaveBeenCalledTimes(2);
        expect(mockRepo.archiveById).not.toHaveBeenCalledWith('child-2', 'user-1');
    });

    it('없는 문서면 400', async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(useCase.execute('missing', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('루트 아카이브 결과가 없으면 400', async () => {
        mockRepo.findById.mockResolvedValue(makeDoc('doc-1'));
        mockRepo.archiveById.mockResolvedValue(null);

        await expect(useCase.execute('doc-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
});
