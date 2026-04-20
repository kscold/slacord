import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { GetMessageSearchUseCase } from '../../application/use-cases/get-message-search.use-case';

@ApiTags('message-search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('message/search')
export class MessageSearchController {
    constructor(private readonly getMessageSearchUseCase: GetMessageSearchUseCase) {}

    @Get()
    @ApiOperation({ summary: '접근 가능한 워크스페이스 메시지 검색 및 개요 조회' })
    @ApiQuery({ name: 'q', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async searchMessages(
        @CurrentUser() user: { userId: string },
        @Query('q') query?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        return this.getMessageSearchUseCase.execute({
            userId: user.userId,
            query,
            limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
        });
    }
}
