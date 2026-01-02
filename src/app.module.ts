import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlackModule } from './slack/slack.module';
import { DiscordModule } from './discord/discord.module';
import { RelayModule } from './relay/relay.module';

/**
 * Slacord 앱 모듈
 * - Slack 메시지를 Discord로 자동 백업하는 중계 서버
 */
@Module({
    imports: [
        // 환경변수 설정
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        SlackModule,
        DiscordModule,
        RelayModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
