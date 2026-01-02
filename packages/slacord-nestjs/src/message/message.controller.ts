import { Controller, Post, Get, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { SendMessageRequestDto } from './dto/request/send-message-request.dto';
import { GetMessagesRequestDto } from './dto/request/get-messages-request.dto';
import { SendMessageResponseDto } from './dto/response/send-message-response.dto';
import { GetMessagesResponseDto } from './dto/response/get-messages-response.dto';

/**
 * 메시지 API 컨트롤러 (중앙집중식 MVP)
 */
@ApiTags('Messages')
@ApiBearerAuth('JWT-Auth')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
    private readonly logger = new Logger(MessageController.name);

    constructor(private readonly messageService: MessageService) {}

    /**
     * 메시지 전송
     * POST /api/messages
     */
    @Post()
    @ApiOperation({
        summary: '메시지 전송',
        description: 'Slack으로 메시지를 전송합니다. RelayService가 자동으로 Discord에 백업합니다.',
    })
    @ApiResponse({ status: 200, description: '메시지 전송 성공', type: SendMessageResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
    async sendMessage(
        @CurrentUser() user: any,
        @Body() requestDto: SendMessageRequestDto,
    ): Promise<SendMessageResponseDto> {
        this.logger.log(`[sendMessage] 메시지 전송 요청: User=${user.userId}, Team=${requestDto.teamId}`);

        return this.messageService.sendMessage(user, requestDto);
    }

    /**
     * 메시지 조회
     * GET /api/messages?teamId=...&before=...&limit=50
     */
    @Get()
    @ApiOperation({
        summary: '메시지 조회',
        description:
            '팀의 메시지를 조회합니다. 90일 이내 메시지는 Slack에서, 90일 이전 메시지는 Discord에서 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '메시지 조회 성공', type: GetMessagesResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
    async getMessages(@Query() requestDto: GetMessagesRequestDto): Promise<GetMessagesResponseDto> {
        this.logger.log(`[getMessages] 메시지 조회 요청: Team=${requestDto.teamId}`);

        return this.messageService.getMessages(requestDto);
    }

    /**
     * 메시지 전체 텍스트 검색 (레거시)
     * GET /api/messages/search?q=검색어&limit=50
     */
    @Get('search')
    @ApiOperation({
        summary: '메시지 검색 (레거시)',
        description: 'MongoDB에 저장된 메시지를 전체 텍스트 검색합니다.',
    })
    @ApiResponse({ status: 200, description: '검색 성공' })
    async searchMessages(@Query('q') query: string, @Query('limit') limit?: string) {
        this.logger.log(`[searchMessages] 검색 요청: "${query}"`);

        const messages = await this.messageService.searchMessages(query, limit ? parseInt(limit, 10) : 50);

        return {
            success: true,
            data: messages,
            count: messages.length,
        };
    }

    /**
     * 채널별 메시지 조회 (레거시)
     * GET /api/messages/channel/:channelId?page=1&limit=50
     */
    @Get('channel/:channelId')
    @ApiOperation({
        summary: '채널별 메시지 조회 (레거시)',
        description: 'MongoDB에 저장된 메시지를 채널별로 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '조회 성공' })
    async getMessagesByChannel(
        @Query('channelId') channelId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        this.logger.log(`[getMessagesByChannel] 채널 조회: ${channelId}`);

        const messages = await this.messageService.getMessagesByChannel(
            channelId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 50,
        );

        const totalCount = await this.messageService.getCountByChannel(channelId);

        return {
            success: true,
            data: messages,
            count: messages.length,
            totalCount,
        };
    }

    /**
     * 사용자별 메시지 조회 (레거시)
     * GET /api/messages/user/:userId?page=1&limit=50
     */
    @Get('user/:userId')
    @ApiOperation({
        summary: '사용자별 메시지 조회 (레거시)',
        description: 'MongoDB에 저장된 메시지를 사용자별로 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '조회 성공' })
    async getMessagesByUser(
        @Query('userId') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        this.logger.log(`[getMessagesByUser] 사용자 조회: ${userId}`);

        const messages = await this.messageService.getMessagesByUser(
            userId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 50,
        );

        return {
            success: true,
            data: messages,
            count: messages.length,
        };
    }

    /**
     * 날짜 범위로 메시지 조회 (레거시)
     * GET /api/messages/range?start=2025-01-01&end=2025-01-31&limit=100
     */
    @Get('range')
    @ApiOperation({
        summary: '날짜 범위 메시지 조회 (레거시)',
        description: 'MongoDB에 저장된 메시지를 날짜 범위로 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '조회 성공' })
    async getMessagesByDateRange(
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('limit') limit?: string,
    ) {
        this.logger.log(`[getMessagesByDateRange] 날짜 범위 조회: ${start} ~ ${end}`);

        const startDate = new Date(start);
        const endDate = new Date(end);

        const messages = await this.messageService.getMessagesByDateRange(
            startDate,
            endDate,
            limit ? parseInt(limit, 10) : 100,
        );

        return {
            success: true,
            data: messages,
            count: messages.length,
        };
    }

    /**
     * 통계 조회 (레거시)
     * GET /api/messages/stats
     */
    @Get('stats')
    @ApiOperation({
        summary: '메시지 통계 조회 (레거시)',
        description: 'MongoDB에 저장된 메시지 통계를 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '통계 조회 성공' })
    async getStats() {
        this.logger.log('[getStats] 통계 조회');

        const totalCount = await this.messageService.getTotalCount();

        return {
            success: true,
            data: {
                totalMessages: totalCount,
            },
        };
    }
}
