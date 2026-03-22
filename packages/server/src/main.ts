import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * Slacord 서버
 * - 팀 올인원 협업 툴 백엔드 (순수 MongoDB 저장 방식)
 * - REST API + Socket.IO WebSocket
 */
async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Swagger 문서
    const config = new DocumentBuilder()
        .setTitle('Slacord API')
        .setDescription('팀 올인원 협업 툴 API')
        .setVersion('1.0')
        .addBearerAuth(undefined, 'JWT-Auth')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT ?? 8082;
    await app.listen(port);

    logger.log(`Server running on http://localhost:${port}`);
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
    new Logger('Bootstrap').error('서버 시작 실패:', err);
    process.exit(1);
});
