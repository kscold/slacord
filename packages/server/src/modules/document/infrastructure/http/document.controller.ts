import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { CreateDocumentCommentUseCase } from '../../application/use-cases/create-document-comment.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { UpdateDocumentCommentStatusUseCase } from '../../application/use-cases/update-document-comment-status.use-case';
import { GetDocumentCommentsUseCase } from '../../application/use-cases/get-document-comments.use-case';
import { GetDocumentsUseCase } from '../../application/use-cases/get-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { ArchiveDocumentUseCase } from '../../application/use-cases/archive-document.use-case';
import { RestoreDocumentUseCase } from '../../application/use-cases/restore-document.use-case';
import { ImportConfluenceSpaceUseCase } from '../../application/use-cases/import-confluence-space.use-case';
import { GetDocumentVersionsUseCase } from '../../application/use-cases/get-document-versions.use-case';
import { RestoreDocumentVersionUseCase } from '../../application/use-cases/restore-document-version.use-case';
import { TeamAccessService } from '../../../team/application/services/team-access.service';
import type { TeamMemberRole } from '../../../team/domain/team.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentCommentDto } from './dto/create-document-comment.dto';
import { ImportConfluenceSpaceDto } from './dto/import-confluence-space.dto';
import { UpdateDocumentCommentStatusDto } from './dto/update-document-comment-status.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

/** 문서/위키 API */
@ApiTags('document')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/document')
export class DocumentController {
    constructor(
        private readonly createUseCase: CreateDocumentUseCase,
        private readonly createCommentUseCase: CreateDocumentCommentUseCase,
        private readonly updateUseCase: UpdateDocumentUseCase,
        private readonly updateCommentStatusUseCase: UpdateDocumentCommentStatusUseCase,
        private readonly getCommentUseCase: GetDocumentCommentsUseCase,
        private readonly getUseCase: GetDocumentsUseCase,
        private readonly deleteUseCase: DeleteDocumentUseCase,
        private readonly archiveUseCase: ArchiveDocumentUseCase,
        private readonly restoreUseCase: RestoreDocumentUseCase,
        private readonly importConfluenceUseCase: ImportConfluenceSpaceUseCase,
        private readonly getVersionsUseCase: GetDocumentVersionsUseCase,
        private readonly restoreVersionUseCase: RestoreDocumentVersionUseCase,
        private readonly teamAccessService: TeamAccessService,
    ) {}

    private async getMemberRole(teamId: string, userId: string): Promise<TeamMemberRole> {
        const access = await this.teamAccessService.requireMember(teamId, userId);
        return access.role;
    }

    private async requireMemberRole(teamId: string, userId: string) {
        return this.getMemberRole(teamId, userId);
    }

    private async requireVisibleDocument(teamId: string, documentId: string, userId: string) {
        const role = await this.requireMemberRole(teamId, userId);
        const doc = await this.getUseCase.executeOne(documentId);
        if (doc.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        if (!doc.canView(userId, role)) throw new ForbiddenException('이 문서를 볼 권한이 없습니다.');
        return { doc, role };
    }

    @Get()
    @ApiOperation({ summary: '팀 문서 트리 목록 조회 (content 제외, 권한 필터링)' })
    async getDocuments(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.requireMemberRole(teamId, user.userId);
        const docs = await this.getUseCase.executeList(teamId);
        const visible = docs.filter((d) => d.canView(user.userId, role));
        return { success: true, data: visible.map((d) => d.toTreeNode()) };
    }

    @Get('archived/list')
    @ApiOperation({ summary: '아카이브된 문서 목록 조회' })
    async getArchivedDocuments(@Param('teamId') teamId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.requireMemberRole(teamId, user.userId);
        if (role !== 'owner' && role !== 'admin') throw new ForbiddenException('아카이브 목록은 관리자만 볼 수 있습니다.');
        const docs = await this.getUseCase.executeList(teamId, true);
        const archived = docs.filter((d) => d.isArchived);
        return { success: true, data: archived.map((d) => d.toTreeNode()) };
    }

    @Get(':documentId')
    @ApiOperation({ summary: '단일 문서 조회 (content 포함, 권한 체크)' })
    async getDocument(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const { doc, role } = await this.requireVisibleDocument(teamId, documentId, user.userId);
        return { success: true, data: { ...doc.toPublic(), canEdit: doc.canEdit(user.userId, role), canDelete: doc.canDelete(user.userId, role) } };
    }

    @Get(':documentId/comment')
    @ApiOperation({ summary: '문서 코멘트 목록 조회' })
    async getDocumentComments(
        @Param('teamId') teamId: string,
        @Param('documentId') documentId: string,
        @CurrentUser() user: { userId: string },
    ) {
        await this.requireVisibleDocument(teamId, documentId, user.userId);
        const comments = await this.getCommentUseCase.executeList(documentId);
        return { success: true, data: comments.map((comment) => comment.toPublic()) };
    }

    @Post(':documentId/comment')
    @ApiOperation({ summary: '문서 코멘트 작성' })
    async createDocumentComment(
        @Param('teamId') teamId: string,
        @Param('documentId') documentId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateDocumentCommentDto,
    ) {
        const writable = await this.teamAccessService.requireWritableMember(teamId, user.userId);
        const { doc } = await this.requireVisibleDocument(teamId, documentId, user.userId);
        if (!doc.canView(user.userId, writable.role)) throw new ForbiddenException('이 문서에 코멘트를 남길 권한이 없습니다.');

        const comment = await this.createCommentUseCase.execute({
            teamId,
            documentId,
            parentId: dto.parentId ?? null,
            content: dto.content,
            anchorText: dto.anchorText,
            createdBy: user.userId,
        });

        return { success: true, data: comment.toPublic() };
    }

    @Patch(':documentId/comment/:commentId')
    @ApiOperation({ summary: '문서 코멘트 해결 상태 변경' })
    async updateDocumentCommentStatus(
        @Param('teamId') teamId: string,
        @Param('documentId') documentId: string,
        @Param('commentId') commentId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: UpdateDocumentCommentStatusDto,
    ) {
        const { doc, role } = await this.requireVisibleDocument(teamId, documentId, user.userId);
        const comment = await this.getCommentUseCase.executeOne(commentId);
        if (comment.teamId !== teamId || comment.documentId !== documentId) {
            throw new ForbiddenException('이 문서 코멘트에 접근할 권한이 없습니다.');
        }
        if (comment.createdBy !== user.userId && !doc.canEdit(user.userId, role)) {
            throw new ForbiddenException('이 문서 코멘트 상태를 변경할 권한이 없습니다.');
        }

        const updated = await this.updateCommentStatusUseCase.execute({
            commentId,
            resolved: dto.resolved,
            actorId: user.userId,
        });
        return { success: true, data: updated.toPublic() };
    }

    @Post()
    @ApiOperation({ summary: '문서 생성' })
    async createDocument(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateDocumentDto,
    ) {
        await this.teamAccessService.requireWritableMember(teamId, user.userId);
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
        const role = await this.requireMemberRole(teamId, user.userId);
        if (role !== 'owner' && role !== 'admin') {
            throw new ForbiddenException('Confluence 가져오기는 관리자만 가능합니다.');
        }
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
        const role = await this.requireMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (existing.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        if (!existing.canEdit(user.userId, role)) throw new ForbiddenException('이 문서를 편집할 권한이 없습니다.');
        // 권한 설정 변경은 owner/admin만
        if ((dto.visibility || dto.editPolicy || dto.allowedViewerIds || dto.allowedEditorIds) && role !== 'owner' && role !== 'admin') {
            throw new ForbiddenException('문서 권한 설정은 관리자만 변경할 수 있습니다.');
        }
        const doc = await this.updateUseCase.execute({ id: documentId, ...dto, updatedBy: user.userId });
        return { success: true, data: doc.toPublic() };
    }

    @Get(':documentId/version')
    @ApiOperation({ summary: '문서 버전 히스토리 조회' })
    async getDocumentVersions(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.requireMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (existing.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        if (!existing.canView(user.userId, role)) throw new ForbiddenException('이 문서 버전을 볼 권한이 없습니다.');
        const versions = await this.getVersionsUseCase.execute(documentId);
        return { success: true, data: versions.map((version) => version.toPublic()) };
    }

    @Post(':documentId/version/:versionId/restore')
    @ApiOperation({ summary: '문서 이전 버전으로 복원' })
    async restoreDocumentVersion(
        @Param('teamId') teamId: string,
        @Param('documentId') documentId: string,
        @Param('versionId') versionId: string,
        @CurrentUser() user: { userId: string },
    ) {
        const role = await this.requireMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (existing.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        if (!existing.canEdit(user.userId, role)) throw new ForbiddenException('이 문서 버전을 복원할 권한이 없습니다.');
        const doc = await this.restoreVersionUseCase.execute(documentId, versionId, user.userId);
        return { success: true, data: doc.toPublic() };
    }

    @Post(':documentId/archive')
    @ApiOperation({ summary: '문서 아카이브 (소프트 삭제)' })
    async archiveDocument(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.requireMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (existing.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        if (!existing.canDelete(user.userId, role)) throw new ForbiddenException('이 문서를 아카이브할 권한이 없습니다.');
        const doc = await this.archiveUseCase.execute(documentId, user.userId);
        return { success: true, data: doc.toPublic() };
    }

    @Post(':documentId/restore')
    @ApiOperation({ summary: '아카이브 문서 복원' })
    async restoreDocument(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.requireMemberRole(teamId, user.userId);
        if (role !== 'owner' && role !== 'admin') throw new ForbiddenException('문서 복원은 관리자만 가능합니다.');
        const existing = await this.getUseCase.executeOne(documentId);
        if (existing.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        const doc = await this.restoreUseCase.execute(documentId);
        return { success: true, data: doc.toPublic() };
    }

    @Delete(':documentId')
    @ApiOperation({ summary: '문서 영구 삭제 (아카이브 상태만)' })
    async deleteDocument(@Param('teamId') teamId: string, @Param('documentId') documentId: string, @CurrentUser() user: { userId: string }) {
        const role = await this.requireMemberRole(teamId, user.userId);
        const existing = await this.getUseCase.executeOne(documentId);
        if (existing.teamId !== teamId) throw new ForbiddenException('이 문서에 접근할 권한이 없습니다.');
        if (!existing.canDelete(user.userId, role)) throw new ForbiddenException('이 문서를 삭제할 권한이 없습니다.');
        if (!existing.isArchived) throw new ForbiddenException('영구 삭제는 아카이브된 문서만 가능합니다. 먼저 아카이브하세요.');
        await this.deleteUseCase.execute(documentId);
        return { success: true };
    }
}
