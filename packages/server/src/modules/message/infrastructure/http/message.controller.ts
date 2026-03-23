import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { GetMessagesUseCase } from '../../application/use-cases/get-messages.use-case';
import { GetPinnedMessagesUseCase } from '../../application/use-cases/get-pinned-messages.use-case';
import { GetThreadMessagesUseCase } from '../../application/use-cases/get-thread-messages.use-case';
import { EditMessageUseCase } from '../../application/use-cases/edit-message.use-case';
import { DeleteMessageUseCase } from '../../application/use-cases/delete-message.use-case';
import { PinMessageUseCase } from '../../application/use-cases/pin-message.use-case';
import { EditMessageDto } from './dto/edit-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';
import { MessageGateway } from '../websocket/message.gateway';

/** 메시지 REST API - 메시지 전송은 WebSocket(gateway)으로 처리 */
@ApiTags('message')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channel/:channelId/message')
export class MessageController {
    constructor(
        private readonly getMessagesUseCase: GetMessagesUseCase,
        private readonly getPinnedMessagesUseCase: GetPinnedMessagesUseCase,
        private readonly getThreadMessagesUseCase: GetThreadMessagesUseCase,
        private readonly editMessageUseCase: EditMessageUseCase,
        private readonly pinMessageUseCase: PinMessageUseCase,
        private readonly deleteMessageUseCase: DeleteMessageUseCase,
        private readonly messageGateway: MessageGateway,
    ) {}

    @Get()
    @ApiOperation({ summary: '채널 메시지 목록 조회 (커서 페이지네이션)' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'before', required: false, type: String, description: 'ISO 8601 날짜' })
    async getMessages(
        @Param('channelId') channelId: string,
        @Query('limit') limit?: string,
        @Query('before') before?: string,
    ) {
        const messages = await this.getMessagesUseCase.execute({
            channelId,
            limit: limit ? parseInt(limit, 10) : 50,
            before: before ? new Date(before) : undefined,
        });
        return { success: true, data: messages.map((m) => m.toPublic()) };
    }

    @Get('pinned')
    @ApiOperation({ summary: '채널 고정 메시지 목록 조회' })
    async getPinnedMessages(@Param('channelId') channelId: string) {
        const messages = await this.getPinnedMessagesUseCase.execute(channelId);
        return { success: true, data: messages.map((message) => message.toPublic()) };
    }

    @Get(':messageId/thread')
    @ApiOperation({ summary: '메시지 스레드 답글 조회' })
    async getThreadMessages(@Param('messageId') messageId: string) {
        const messages = await this.getThreadMessagesUseCase.execute(messageId);
        return { success: true, data: messages.map((message) => message.toPublic()) };
    }

    @Patch(':messageId')
    @ApiOperation({ summary: '메시지 편집 (작성자 본인만)' })
    async editMessage(
        @Param('channelId') _channelId: string,
        @Param('messageId') messageId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: EditMessageDto,
    ) {
        const message = await this.editMessageUseCase.execute(messageId, user.userId, dto.content);
        return { success: true, data: message.toPublic() };
    }

    @Patch(':messageId/pin')
    @ApiOperation({ summary: '메시지 고정 / 해제' })
    async pinMessage(
        @Param('channelId') channelId: string,
        @Param('messageId') messageId: string,
        @Body() dto: PinMessageDto,
    ) {
        const message = await this.pinMessageUseCase.execute(messageId, dto.isPinned);
        this.messageGateway.emitPinnedUpdated(channelId, message.toPublic());
        return { success: true, data: message.toPublic() };
    }

    @Delete(':messageId')
    @ApiOperation({ summary: '메시지 삭제 (작성자 본인만)' })
    async deleteMessage(
        @Param('channelId') _channelId: string,
        @Param('messageId') messageId: string,
        @CurrentUser() user: { userId: string },
    ) {
        await this.deleteMessageUseCase.execute(messageId, user.userId);
        return { success: true };
    }
}
