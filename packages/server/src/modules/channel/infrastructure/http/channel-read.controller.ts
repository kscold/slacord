import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { MarkChannelAsReadUseCase } from '../../application/use-cases/mark-channel-as-read.use-case';

@ApiTags('channel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channel/:channelId')
export class ChannelReadController {
    constructor(private readonly markChannelAsReadUseCase: MarkChannelAsReadUseCase) {}

    @Patch('read')
    @ApiOperation({ summary: '채널 읽음 처리' })
    async markAsRead(@Param('channelId') channelId: string, @CurrentUser() user: { userId: string }) {
        const state = await this.markChannelAsReadUseCase.execute(channelId, user.userId);
        return {
            success: true,
            data: {
                channelId: state.channelId,
                userId: state.userId,
                lastReadAt: state.lastReadAt.toISOString(),
            },
        };
    }
}
