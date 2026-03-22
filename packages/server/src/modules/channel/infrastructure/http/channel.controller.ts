import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateChannelUseCase } from '../../application/use-cases/create-channel.use-case';
import { GetChannelsUseCase } from '../../application/use-cases/get-channels.use-case';
import { CreateChannelDto } from './dto/create-channel.dto';

/** 채널 API */
@ApiTags('channel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/channel')
export class ChannelController {
    constructor(
        private readonly createChannelUseCase: CreateChannelUseCase,
        private readonly getChannelsUseCase: GetChannelsUseCase,
    ) {}

    @Get()
    @ApiOperation({ summary: '팀의 채널 목록 조회' })
    async getChannels(@Param('teamId') teamId: string) {
        const channels = await this.getChannelsUseCase.execute(teamId);
        return { success: true, data: channels.map((c) => c.toPublic()) };
    }

    @Post()
    @ApiOperation({ summary: '채널 생성' })
    async createChannel(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: CreateChannelDto,
    ) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const channel = await this.createChannelUseCase.execute({
            teamId,
            createdBy: user.userId,
            ...dto,
        });
        return { success: true, data: channel.toPublic() };
    }
}
