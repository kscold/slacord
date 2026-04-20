import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

type UnknownRecord = Record<string, unknown>;

interface PublicSerializable {
    toPublic(): unknown;
}

function hasToPublic(value: unknown): value is PublicSerializable {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { toPublic?: unknown }).toPublic === 'function'
    );
}

function isAlreadyWrapped(value: unknown): value is UnknownRecord & { success: unknown } {
    return typeof value === 'object' && value !== null && 'success' in value;
}

/**
 * 엔티티 인스턴스에 `.toPublic()`이 선언되어 있으면 자동 호출.
 * 배열은 원소별로 적용. 그 외는 그대로.
 */
function serialize(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(serialize);
    }
    if (hasToPublic(value)) {
        return value.toPublic();
    }
    return value;
}

/**
 * 모든 HTTP 응답을 `{ success: true, data }` 형태로 자동 래핑한다.
 *
 * 규칙:
 * - 응답이 이미 `success` 키를 포함하면 그대로 통과 (명시적 `{ success: false, ... }` opt-out)
 * - 응답 루트가 엔티티(`.toPublic()` 메서드 보유)면 자동 직렬화
 * - 응답이 배열이면 원소별 자동 직렬화
 * - 그 외는 그대로 래핑
 *
 * WebSocket/RPC 컨텍스트는 건너뛴다.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        return next.handle().pipe(
            map((response) => {
                if (isAlreadyWrapped(response)) return response;
                const data = serialize(response);
                if (data === undefined) {
                    return { success: true };
                }
                return { success: true, data };
            }),
        );
    }
}
