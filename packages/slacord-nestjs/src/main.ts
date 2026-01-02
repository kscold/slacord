import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

/**
 * Slacord 중계 서버
 * - Slack 메시지를 Discord로 자동 백업
 * - 90일 제한 없는 영구 메시지 아카이빙
 */
async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule);

    // Cookie Parser 미들웨어 적용
    app.use(cookieParser());

    // CORS 설정 (프론트엔드 연동)
    app.enableCors({
        origin: true, // 개발 환경에서는 모든 origin 허용
        credentials: true, // 쿠키 전송 허용
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // 글로벌 프리픽스 설정
    app.setGlobalPrefix('api');

    const port = process.env.PORT ?? 8082;
    await app.listen(port);

    logger.log(`🚀 Slacord 서버가 http://localhost:${port} 에서 실행 중입니다.`);
    logger.log(`📡 API 엔드포인트: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
    const logger = new Logger('Bootstrap');
    logger.error('서버 시작 실패:', err);
    process.exit(1);
});
