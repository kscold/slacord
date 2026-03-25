import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { ImportDiscordGuildUseCase } from '../../application/use-cases/import-discord-guild.use-case';
import { ImportDiscordGuildDto } from './dto/import-discord-guild.dto';

@ApiTags('discord')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/discord')
export class DiscordImportController {
    constructor(private readonly importDiscordGuildUseCase: ImportDiscordGuildUseCase) {}

    @Post('import')
    @ApiOperation({ summary: 'Discord guild 대화/채널 데이터 가져오기' })
    async importGuild(
        @Param('teamId') teamId: string,
        @CurrentUser() user: { userId: string },
        @Body() dto: ImportDiscordGuildDto,
    ) {
        return {
            success: true,
            data: await this.importDiscordGuildUseCase.execute({
                teamId,
                requestedBy: user.userId,
                botToken: dto.botToken.trim(),
                guildId: dto.guildId.trim(),
                channelIds: dto.channelIds?.map((id) => id.trim()).filter(Boolean),
            }),
        };
    }
}
