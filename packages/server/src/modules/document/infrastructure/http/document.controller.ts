import { Body, Controller, Delete, ForbiddenException, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { GetDocumentsUseCase } from '../../application/use-cases/get-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { ImportConfluenceSpaceUseCase } from '../../application/use-cases/import-confluence-space.use-case';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ImportConfluenceSpaceDto } from './dto/import-confluence-space.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

/** 문서/위키 API */
@ApiTags('document')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/document')
export class DocumentController {
    constructor(
        private readonly createUseCase: CreateDocumentUseCase,
        private readonly updateUseCase: UpdateDocumentUseCase,
        private readonly getUseCase: GetDocumentsUseCase,
        private readonly deleteUseCase: DeleteDocumentUseCase,
        private readonly importConfluenceUseCase: ImportConfluenceSpaceUseCase,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    private async getMemberRole(teamId: string, userId: string): Promise<string> {
        const team = await this.teamRepo.findById(teamId);
        if (!team) return 'member';
        const member = team.members.find((m) => m.userId === userId);
        return member?.role ?? 'member';
    }

    @Get()
    @ApiOperation({ summary: '팀 문서 트리 목록 조회 (content 제외, 권한 필터링)' })
    async getDocuments(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.getMemberRole(teamId, user.userId);
        const docs = await this.getUseCase.executeList(teamId);
        const visible = docs.filter((d) => d.canView(user.userId, role));
        return { success: true, data: visible.map((d) => d.toTreeNode()) };
    }

    @Get(':documentId')
    @ApiOperation({ summary: '단일 문서 조회 (content 포함, 권한 체크)' })
    async getDocument(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.getMemberRole(teamId, user.userId);
        const doc = await this.getUseCase.executeOne(documentId);
        if (!doc.canView(user.userId, role)) throw new ForbiddenException('이 문서를 볼 권한이 없습니다.');
        return { success: true, data: { ...doc.toPublic(), canEdit: doc.canEdit(user.userId, role), canDelete: doc.canDelete(user.userId, role) } };
    }

    @Post()
    @ApiOperation({ summary: '문서 생성' })
    async createDocument(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateDocumentDto,
    ) {
        const doc = await this.createUseCase.execute({
            teamId,
            title: dto.title,
            content: dto.content ?? '',
            contentFormat: dto.contentFormat ?? 'plain',
            parentId: dto.parentId ?? null,
            createdBy: user.userId,
        });
        return { success: true, data: doc.toPublic() };
    }

    @Post('import/confluence')
    @ApiOperation({ summary: 'Confluence space 전체 문서 가져오기' })
    async importConfluence(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: ImportConfluenceSpaceDto,
    ) {
        return {
            success: true,
            data: await this.importConfluenceUseCase.execute({ ...dto, teamId, requestedBy: user.userId }),
        };
    }

    @Patch(':documentId')
    @ApiOperation({ summary: '문서 수정 (권한 체크)' })
    async updateDocument(
        @Param('teamId') teamId: string,
        @Param('documentId') documentId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: UpdateDocumentDto,
    ) {
        const role = await this.getMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (!existing.canEdit(user.userId, role)) throw new ForbiddenException('이 문서를 편집할 권한이 없습니다.');
        // 권한 설정 변경은 owner/admin만
        if ((dto.visibility || dto.editPolicy || dto.allowedViewerIds || dto.allowedEditorIds) && role !== 'owner' && role !== 'admin') {
            throw new ForbiddenException('문서 권한 설정은 관리자만 변경할 수 있습니다.');
        }
        const doc = await this.updateUseCase.execute({ id: documentId, ...dto, updatedBy: user.userId });
        return { success: true, data: doc.toPublic() };
    }

    @Delete(':documentId')
    @ApiOperation({ summary: '문서 삭제 (권한 체크)' })
    async deleteDocument(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.getMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (!existing.canDelete(user.userId, role)) throw new ForbiddenException('이 문서를 삭제할 권한이 없습니다.');
        await this.deleteUseCase.execute(documentId);
        return { success: true };
    }
}
