import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';
import type { IDocumentVersionRepository } from '../../domain/document-version.port';
import { DOCUMENT_VERSION_REPOSITORY } from '../../domain/document-version.port';

@Injectable()
export class UpdateDocumentUseCase {
    constructor(
        @Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository,
        @Inject(DOCUMENT_VERSION_REPOSITORY) private readonly versionRepo: IDocumentVersionRepository,
    ) {}

    async execute(data: { id: string; title?: string; content?: string; contentFormat?: 'plain' | 'html' | 'json'; updatedBy: string }): Promise<DocumentEntity> {
        const { id, ...updateData } = data;
        const current = await this.repo.findById(id);
        if (!current) throw new BadRequestException('존재하지 않는 문서입니다.');
        if (hasDocumentChange(current, data)) {
            await this.versionRepo.save({
                documentId: current.id,
                teamId: current.teamId,
                title: current.title,
                content: current.content,
                contentFormat: current.contentFormat,
                savedBy: data.updatedBy,
            });
        }
        const result = await this.repo.update(id, updateData);
        if (!result) throw new BadRequestException('존재하지 않는 문서입니다.');
        return result;
    }
}

function hasDocumentChange(current: DocumentEntity, next: { title?: string; content?: string; contentFormat?: 'plain' | 'html' | 'json' }) {
    return (
        (next.title !== undefined && next.title !== current.title)
        || (next.content !== undefined && next.content !== current.content)
        || (next.contentFormat !== undefined && next.contentFormat !== current.contentFormat)
    );
}
