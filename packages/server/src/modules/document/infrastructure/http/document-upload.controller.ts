import { BadRequestException, Controller, ForbiddenException, Inject, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { UploadDocumentFileUseCase } from '../../application/use-cases/upload-document-file.use-case';
import { GetDocumentsUseCase } from '../../application/use-cases/get-documents.use-case';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';

@ApiTags('document')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/document')
export class DocumentUploadController {
    constructor(
        private readonly uploadUseCase: UploadDocumentFileUseCase,
        private readonly getDocumentsUseCase: GetDocumentsUseCase,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    private async getMemberRole(teamId: string, userId: string) {
        const team = await this.teamRepo.findById(teamId);
        const member = team?.members.find((item) => item.userId === userId);
        return member?.role ?? null;
    }

    @Post(':documentId/file')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '문서 첨부 파일 업로드' })
    async uploadFile(
        @Param('teamId') teamId: string,
        @Param('documentId') documentId: string,
        @CurrentUser() user: { userId: string },
        @UploadedFile() file?: any,
    ) {
        if (!file?.buffer) throw new BadRequestException('업로드할 파일이 필요합니다.');
        const role = await this.getMemberRole(teamId, user.userId);
        if (!role) throw new ForbiddenException('문서 파일 업로드 권한이 없습니다.');
        const document = await this.getDocumentsUseCase.executeOne(documentId);
        if (document.teamId !== teamId) throw new ForbiddenException('이 문서에 파일을 업로드할 권한이 없습니다.');
        if (!document.canEdit(user.userId, role)) {
            throw new ForbiddenException('이 문서에 파일을 업로드할 권한이 없습니다.');
        }
        return { success: true, data: await this.uploadUseCase.execute({ teamId, documentId, file }) };
    }

    @Post('upload/image')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '에디터 인라인 이미지 업로드' })
    async uploadImage(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @UploadedFile() file?: any,
    ) {
        if (!file?.buffer) throw new BadRequestException('업로드할 파일이 필요합니다.');
        if (!file.mimetype?.startsWith('image/')) throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
        const role = await this.getMemberRole(teamId, user.userId);
        if (!role) throw new ForbiddenException('문서 이미지 업로드 권한이 없습니다.');
        return { success: true, data: await this.uploadUseCase.execute({ teamId, file }) };
    }
}
