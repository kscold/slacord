import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 로그인한 사용자 정보 추출 데코레이터
 * - JWT Guard에서 주입한 user 객체 반환
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
