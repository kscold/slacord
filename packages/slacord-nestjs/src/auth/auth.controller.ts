import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * 인증 컨트롤러
 */
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    /**
     * 회원가입
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('username') username: string,
    ) {
        const result = await this.authService.register(email, password, username);
        return {
            success: true,
            data: result,
            message: '회원가입이 완료되었습니다.',
        };
    }

    /**
     * 로그인
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body('email') email: string, @Body('password') password: string) {
        const result = await this.authService.login(email, password);
        return {
            success: true,
            data: result,
            message: '로그인에 성공했습니다.',
        };
    }
}
