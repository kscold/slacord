import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IDocumentRepository } from '../../domain/document.port';
import { DOCUMENT_REPOSITORY } from '../../domain/document.port';
import type { DocumentEntity } from '../../domain/document.entity';

@Injectable()
export class GetDocumentsUseCase {
    constructor(@Inject(DOCUMENT_REPOSITORY) private readonly repo: IDocumentRepository) {}

    /** 팀 문서 트리 목록 조회 */
    async executeList(teamId: string): Promise<DocumentEntity[]> {
        return this.repo.findByTeam(teamId);
    }

    /** 단일 문서 조회 */
    async executeOne(id: string): Promise<DocumentEntity> {
        const doc = await this.repo.findById(id);
        if (!doc) throw new BadRequestException('존재하지 않는 문서입니다.');
        return doc;
    }
}
