import { Controller, Post, Body, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

/**
 * 인증 컨트롤러
 * - JWT 토큰을 HttpOnly 쿠키로 설정
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
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(email, password, username);

        // HttpOnly 쿠키로 JWT 토큰 설정
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true, // XSS 공격 방지
            secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
            sameSite: 'lax', // CSRF 공격 방지
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        });

        return {
            success: true,
            data: {
                user: result.user,
                // 프론트엔드에서도 저장할 수 있도록 토큰 포함
                accessToken: result.accessToken,
            },
            message: '회원가입이 완료되었습니다.',
        };
    }

    /**
     * 로그인
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(email, password);

        // HttpOnly 쿠키로 JWT 토큰 설정
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true, // XSS 공격 방지
            secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
            sameSite: 'lax', // CSRF 공격 방지
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        });

        return {
            success: true,
            data: {
                user: result.user,
                // 프론트엔드에서도 저장할 수 있도록 토큰 포함
                accessToken: result.accessToken,
            },
            message: '로그인에 성공했습니다.',
        };
    }

    /**
     * 로그아웃
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res({ passthrough: true }) res: Response) {
        // 쿠키 삭제
        res.clearCookie('accessToken');

        return {
            success: true,
            message: '로그아웃되었습니다.',
        };
    }
}
