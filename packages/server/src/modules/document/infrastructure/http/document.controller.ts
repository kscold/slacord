import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { GetDocumentsUseCase } from '../../application/use-cases/get-documents.use-case';
import { DeleteDocumentUseCase } from '../../application/use-cases/delete-document.use-case';
import { ImportConfluenceSpaceUseCase } from '../../application/use-cases/import-confluence-space.use-case';
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
    ) {}

    @Get()
    @ApiOperation({ summary: '팀 문서 트리 목록 조회 (content 제외)' })
    async getDocuments(@Param('teamId') teamId: string) {
        const docs = await this.getUseCase.executeList(teamId);
        return { success: true, data: docs.map((d) => d.toTreeNode()) };
    }

    @Get(':documentId')
    @ApiOperation({ summary: '단일 문서 조회 (content 포함)' })
    async getDocument(@Param('documentId') documentId: string) {
        const doc = await this.getUseCase.executeOne(documentId);
        return { success: true, data: doc.toPublic() };
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
    @ApiOperation({ summary: '문서 수정' })
    async updateDocument(
        @Param('documentId') documentId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: UpdateDocumentDto,
    ) {
        const doc = await this.updateUseCase.execute({ id: documentId, ...dto, updatedBy: user.userId });
        return { success: true, data: doc.toPublic() };
    }

    @Delete(':documentId')
    @ApiOperation({ summary: '문서 삭제' })
    async deleteDocument(@Param('documentId') documentId: string) {
        await this.deleteUseCase.execute(documentId);
        return { success: true };
    }
}
