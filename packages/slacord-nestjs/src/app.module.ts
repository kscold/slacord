import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlackModule } from './slack/slack.module';
import { DiscordModule } from './discord/discord.module';
import { MessageModule } from './message/message.module';
import { TeamModule } from './team/team.module';
import { AuthModule } from './auth/auth.module';
import { RelayModule } from './relay/relay.module';

/**
 * Slacord 앱 모듈 (중앙집중식 MVP)
 * - 사용자가 API를 통해 Slack 메시지를 전송하고 Discord에 백업
 * - JWT 인증 기반 팀 관리 및 메시지 조회
 * - Slack 메시지 실시간 수신 → Discord 자동 백업
 */
@Module({
    imports: [
        // 환경변수 설정
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // MongoDB 연결
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/slacord',
            }),
            inject: [ConfigService],
        }),
        SlackModule,
        DiscordModule,
        MessageModule,
        TeamModule,
        AuthModule,
        RelayModule, // Slack → Discord 실시간 백업
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
