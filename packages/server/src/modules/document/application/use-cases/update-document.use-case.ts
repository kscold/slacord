import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';

@Injectable()
export class UpdateDocumentUseCase {
    constructor(@Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository) {}

    async execute(data: { id: string; title?: string; content?: string; updatedBy: string }): Promise<DocumentEntity> {
        const { id, ...updateData } = data;
        const result = await this.repo.update(id, updateData);
        if (!result) throw new BadRequestException('존재하지 않는 문서입니다.');
        return result;
    }
}
