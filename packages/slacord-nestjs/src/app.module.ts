import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlackModule } from './slack/slack.module';
import { DiscordModule } from './discord/discord.module';
import { RelayModule } from './relay/relay.module';
import { MessageModule } from './message/message.module';
import { TeamModule } from './team/team.module';

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
        RelayModule,
        MessageModule,
        TeamModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
