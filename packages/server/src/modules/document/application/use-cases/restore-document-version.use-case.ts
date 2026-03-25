import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { IDocumentVersionRepository } from '../../domain/document-version.port';
import { DOCUMENT_VERSION_REPOSITORY } from '../../domain/document-version.port';

@Injectable()
export class RestoreDocumentVersionUseCase {
    constructor(
        @Inject(DOCUMENT_REPOSITORY) private readonly docRepo: IDocumentRepository,
        @Inject(DOCUMENT_VERSION_REPOSITORY) private readonly versionRepo: IDocumentVersionRepository,
    ) {}

    async execute(documentId: string, versionId: string, updatedBy: string) {
        const current = await this.docRepo.findById(documentId);
        const version = await this.versionRepo.findById(versionId);
        if (!current || !version) throw new BadRequestException('복원할 버전을 찾을 수 없습니다.');
        if (version.documentId !== documentId || version.teamId !== current.teamId) {
            throw new BadRequestException('이 문서의 버전이 아닙니다.');
        }
        await this.versionRepo.save({
            documentId: current.id,
            teamId: current.teamId,
            title: current.title,
            content: current.content,
            contentFormat: current.contentFormat,
            savedBy: updatedBy,
        });
        const restored = await this.docRepo.update(documentId, {
            title: version.title,
            content: version.content,
            contentFormat: version.contentFormat,
            updatedBy,
        });
        if (!restored) throw new BadRequestException('문서를 복원할 수 없습니다.');
        return restored;
    }
}
