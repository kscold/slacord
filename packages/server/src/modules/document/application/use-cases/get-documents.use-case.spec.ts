import { BadRequestException } from '@nestjs/common';
import { GetDocumentsUseCase } from './get-documents.use-case';
import { DocumentEntity } from '../../domain/document.entity';

function makeDoc(id: string, archived = false): DocumentEntity {
    return new DocumentEntity(
        id,
        'team-1',
        `문서 ${id}`,
        '',
        'plain',
        null,
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
        null,
        new Date(),
        new Date(),
    );
}

describe('GetDocumentsUseCase', () => {
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

    let useCase: GetDocumentsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetDocumentsUseCase(mockRepo as any);
    });

    it('팀 문서 목록 조회', async () => {
        mockRepo.findByTeam.mockResolvedValue([makeDoc('1'), makeDoc('2')]);

        const result = await useCase.executeList('team-1');

        expect(result).toHaveLength(2);
        expect(mockRepo.findByTeam).toHaveBeenCalledWith('team-1', false);
    });

    it('아카이브 포함 조회', async () => {
        mockRepo.findByTeam.mockResolvedValue([makeDoc('1'), makeDoc('2', true)]);

        const result = await useCase.executeList('team-1', true);

        expect(result).toHaveLength(2);
        expect(mockRepo.findByTeam).toHaveBeenCalledWith('team-1', true);
    });

    it('단일 문서 조회', async () => {
        mockRepo.findById.mockResolvedValue(makeDoc('1'));

        const result = await useCase.executeOne('1');

        expect(result.id).toBe('1');
        expect(mockRepo.findById).toHaveBeenCalledWith('1');
    });

    it('없는 문서 조회 시 400', async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(useCase.executeOne('missing')).rejects.toThrow(BadRequestException);
    });
});
