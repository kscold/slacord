import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';

@Injectable()
export class ArchiveDocumentUseCase {
    constructor(@Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository) {}

    async execute(id: string, archivedBy: string): Promise<DocumentEntity> {
        const root = await this.repo.findById(id);
        if (!root) throw new BadRequestException('문서를 찾을 수 없습니다.');
        const doc = await this.repo.archiveById(id, archivedBy);
        if (!doc) throw new BadRequestException('문서를 찾을 수 없습니다.');
        const documents = await this.repo.findByTeam(root.teamId, true);
        const descendants = collectDescendantIds(documents, id);
        await Promise.all(descendants.map((documentId) => this.repo.archiveById(documentId, archivedBy)));
        return doc;
    }
}

function collectDescendantIds(documents: DocumentEntity[], rootId: string) {
    const queue = [rootId];
    const collected: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = documents.filter((document) => document.parentId === current && !document.isArchived);
        children.forEach((child) => {
            collected.push(child.id);
            queue.push(child.id);
        });
    }

    return collected;
}
