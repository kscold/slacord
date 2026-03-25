import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { IDocumentVersionRepository } from '../../domain/document-version.port';
import { DOCUMENT_VERSION_REPOSITORY } from '../../domain/document-version.port';

@Injectable()
export class GetDocumentVersionsUseCase {
    constructor(@Inject(DOCUMENT_VERSION_REPOSITORY) private readonly repo: IDocumentVersionRepository) {}

    async execute(documentId: string) {
        if (!documentId) throw new BadRequestException('문서가 필요합니다.');
        return this.repo.findByDocument(documentId);
    }
}
