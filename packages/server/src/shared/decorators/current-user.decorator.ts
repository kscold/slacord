import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** JWT 토큰에서 추출한 현재 사용자 정보를 파라미터로 주입 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
