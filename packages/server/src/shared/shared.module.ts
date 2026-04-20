import { Global, Module } from '@nestjs/common';
import { CLOCK, SystemClock } from './lib/clock';

/**
 * 전역 공유 프로바이더 (Clock 등).
 * @Global로 만들어 다른 모듈에서 import 없이 사용 가능.
 */
@Global()
@Module({
    providers: [{ provide: CLOCK, useClass: SystemClock }],
    exports: [CLOCK],
})
export class SharedModule {}
