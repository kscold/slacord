import { Controller, Get, Query, Logger } from '@nestjs/common';
import { MessageService } from './message.service';

/**
 * 메시지 검색 API 컨트롤러
 */
@Controller('messages')
export class MessageController {
    private readonly logger = new Logger(MessageController.name);

    constructor(private readonly messageService: MessageService) {}

    /**
     * 메시지 전체 텍스트 검색
     * GET /api/messages/search?q=검색어&limit=50
     */
    @Get('search')
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
     * 채널별 메시지 조회
     * GET /api/messages/channel/:channelId?page=1&limit=50
     */
    @Get('channel/:channelId')
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
     * 사용자별 메시지 조회
     * GET /api/messages/user/:userId?page=1&limit=50
     */
    @Get('user/:userId')
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
     * 날짜 범위로 메시지 조회
     * GET /api/messages/range?start=2025-01-01&end=2025-01-31&limit=100
     */
    @Get('range')
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
     * 통계 조회
     * GET /api/messages/stats
     */
    @Get('stats')
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
