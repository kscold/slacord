import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { LoginUseCase, LoginOutput } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/** 인증 API - 회원가입, 로그인, 내 정보 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly registerUseCase: RegisterUseCase,
        private readonly getMeUseCase: GetMeUseCase,
    ) {}

    private isSecureCookie() {
        return process.env.COOKIE_SECURE === 'true';
    }

    @Post('register')
    @ApiOperation({ summary: '회원가입' })
    async register(@Body() dto: RegisterDto) {
        const user = await this.registerUseCase.execute(dto);
        return { success: true, data: user.toPublic() };
    }

    @Post('login')
    @ApiOperation({ summary: '로그인' })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ success: boolean; data: LoginOutput }> {
        const result = await this.loginUseCase.execute(dto);
        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: this.isSecureCookie(),
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { success: true, data: result };
    }

    @Post('logout')
    @ApiOperation({ summary: '로그아웃' })
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: this.isSecureCookie(),
            path: '/',
        });
        return { success: true };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '내 정보 조회' })
    async getMe(@CurrentUser() user: { userId: string }) {
        return { success: true, data: await this.getMeUseCase.execute(user.userId) };
    }
}
