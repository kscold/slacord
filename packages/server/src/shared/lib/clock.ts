import { Injectable } from '@nestjs/common';

/**
 * 현재 시각을 주입 가능하게 만드는 추상.
 *
 * 기존에 use case / service 전반에 `new Date()`가 흩어져 있어
 * - 테스트에서 시간 고정이 불가능
 * - 한 요청 안에서 여러 번 `new Date()`를 호출하면 타임스탬프가 미세하게 어긋남
 *
 * 모든 비즈니스 로직은 `@Inject(CLOCK) clock: Clock`으로 주입받아
 * `clock.now()`를 호출해야 한다. 인프라 계층(리포지토리 타임스탬프 기본값 등)은
 * 기존 `new Date()` 유지해도 무방.
 */
export interface Clock {
    now(): Date;
}

export const CLOCK = Symbol('Clock');

/** 운영용 기본 구현 — System wall clock */
@Injectable()
export class SystemClock implements Clock {
    now(): Date {
        return new Date();
    }
}
