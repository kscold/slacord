import { BadRequestException, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { GetInvitePreviewUseCase } from '../../application/use-cases/get-invite-preview.use-case';
import { JoinTeamByInviteUseCase } from '../../application/use-cases/join-team-by-invite.use-case';

@ApiTags('team')
@Controller('team/invite')
export class TeamInviteController {
    constructor(
        private readonly getInvitePreviewUseCase: GetInvitePreviewUseCase,
        private readonly joinTeamByInviteUseCase: JoinTeamByInviteUseCase,
    ) {}

    @Get(':code')
    @ApiOperation({ summary: '초대 링크 미리보기' })
    async getInvitePreview(@Param('code') code: string) {
        return { success: true, data: await this.getInvitePreviewUseCase.execute(code) };
    }

    @Post(':code/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '초대 링크로 팀 참여' })
    async joinByInvite(@Param('code') code: string, @CurrentUser() user: { userId: string }) {
        if (!user?.userId) throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        const team = await this.joinTeamByInviteUseCase.execute(code, user.userId);
        return { success: true, data: team.toPublic() };
    }
}
