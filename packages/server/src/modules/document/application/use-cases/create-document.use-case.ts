import { Inject, Injectable } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';

@Injectable()
export class CreateDocumentUseCase {
    constructor(@Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository) {}

    async execute(data: {
        teamId: string;
        title: string;
        content: string;
        parentId: string | null;
        createdBy: string;
    }): Promise<DocumentEntity> {
        return this.repo.save(data);
    }
}
