import { BadRequestException } from '@nestjs/common';
import { ArchiveDocumentUseCase } from './archive-document.use-case';
import { DocumentEntity } from '../../domain/document.entity';

function makeDoc(id: string, parentId: string | null = null, archived = false): DocumentEntity {
    return new DocumentEntity(id, 'team-1', `문서 ${id}`, '', 'plain', parentId, 'user-1', 'user-1', null, null, null, 'team', 'owner_admin', [], [], archived ? new Date() : null, archived ? 'user-1' : null, new Date(), new Date());
}

describe('ArchiveDocumentUseCase', () => {
    const mockRepo = {
        findById: jest.fn(),
        findByTeam: jest.fn(),
        archiveById: jest.fn(),
        archiveByIds: jest.fn(),
        archiveByParentId: jest.fn(),
        restoreById: jest.fn(),
        restoreByIds: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        deleteById: jest.fn(),
        search: jest.fn(),
        upsertExternal: jest.fn(),
    };

    let useCase: ArchiveDocumentUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ArchiveDocumentUseCase(mockRepo as any);
    });

    it('정상 아카이브', async () => {
        const doc = makeDoc('doc-1');
        mockRepo.findById.mockResolvedValue(doc);
        mockRepo.archiveById.mockResolvedValue(makeDoc('doc-1', null, true));
        mockRepo.findByTeam.mockResolvedValue([doc]);
        mockRepo.archiveByIds.mockResolvedValue(0);

        const result = await useCase.execute('doc-1', 'user-1');
        expect(result.isArchived).toBe(true);
        expect(mockRepo.archiveById).toHaveBeenCalledWith('doc-1', 'user-1');
    });

    it('하위 문서도 벌크 아카이브', async () => {
        const parent = makeDoc('parent');
        const child1 = makeDoc('child-1', 'parent');
        const child2 = makeDoc('child-2', 'parent');
        mockRepo.findById.mockResolvedValue(parent);
        mockRepo.archiveById.mockResolvedValue(makeDoc('parent', null, true));
        mockRepo.findByTeam.mockResolvedValue([parent, child1, child2]);
        mockRepo.archiveByIds.mockResolvedValue(2);

        await useCase.execute('parent', 'user-1');
        expect(mockRepo.archiveByIds).toHaveBeenCalledWith(['child-1', 'child-2'], 'user-1');
    });

    it('없는 문서면 400', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(useCase.execute('nonexistent', 'user-1')).rejects.toThrow(BadRequestException);
    });
});
