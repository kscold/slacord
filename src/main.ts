import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Slacord 중계 서버
 * - Slack 메시지를 Discord로 자동 백업
 * - 90일 제한 없는 영구 메시지 아카이빙
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // CORS 설정 (추후 프론트엔드 연동 시 필요)
  app.enableCors();

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Slacord 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  logger.log(`📡 API 엔드포인트: http://localhost:${port}/api`);
}

bootstrap();
