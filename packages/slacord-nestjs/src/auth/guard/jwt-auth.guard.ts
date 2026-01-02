import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 가드
 * - JWT 토큰 검증
 * - Request에 user 객체 주입
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            throw err || new UnauthorizedException('인증이 필요합니다.');
        }
        return user;
    }
}
