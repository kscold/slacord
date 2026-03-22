import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoginUseCase, LoginOutput } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
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
    ) {}

    @Post('register')
    @ApiOperation({ summary: '회원가입' })
    async register(@Body() dto: RegisterDto) {
        const user = await this.registerUseCase.execute(dto);
        return { success: true, data: user.toPublic() };
    }

    @Post('login')
    @ApiOperation({ summary: '로그인' })
    async login(@Body() dto: LoginDto): Promise<{ success: boolean; data: LoginOutput }> {
        const result = await this.loginUseCase.execute(dto);
        return { success: true, data: result };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '내 정보 조회' })
    getMe(@CurrentUser() user: { userId: string; email: string }) {
        return { success: true, data: user };
    }
}
