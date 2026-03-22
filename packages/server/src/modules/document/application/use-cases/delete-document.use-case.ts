import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';

@Injectable()
export class DeleteDocumentUseCase {
    constructor(@Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository) {}

    async execute(id: string): Promise<void> {
        const deleted = await this.repo.deleteById(id);
        if (!deleted) throw new BadRequestException('존재하지 않는 문서입니다.');
    }
}
