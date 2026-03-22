import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { GetMessagesUseCase } from '../../application/use-cases/get-messages.use-case';

/** 메시지 REST API - 메시지 전송은 WebSocket(gateway)으로 처리 */
@ApiTags('message')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channel/:channelId/message')
export class MessageController {
    constructor(private readonly getMessagesUseCase: GetMessagesUseCase) {}

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
}
