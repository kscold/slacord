import {
    BadRequestException,
    Body,
    Controller,
    Param,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { UploadMessageAttachmentUseCase } from '../../application/use-cases/upload-message-attachment.use-case';
import { UploadMessageAttachmentDto } from './dto/upload-message-attachment.dto';

@ApiTags('message')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channel/:channelId/message')
export class MessageUploadController {
    constructor(private readonly uploadMessageAttachmentUseCase: UploadMessageAttachmentUseCase) {}

    @Post('attachment')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                teamId: { type: 'string' },
                file: { type: 'string', format: 'binary' },
            },
            required: ['teamId', 'file'],
        },
    })
    @ApiOperation({ summary: '메시지 첨부 파일 업로드' })
    async upload(
        @Param('channelId') channelId: string,
        @Body() dto: UploadMessageAttachmentDto,
        @CurrentUser() user: { userId: string },
        @UploadedFile() file?: any,
    ) {
        if (!file?.buffer) {
            throw new BadRequestException('업로드할 파일이 필요합니다.');
        }
        return {
            success: true,
            data: await this.uploadMessageAttachmentUseCase.execute({
                teamId: dto.teamId,
                channelId,
                userId: user.userId,
                file,
            }),
        };
    }
}
