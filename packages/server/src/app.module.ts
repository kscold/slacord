import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { TeamAccessGuard } from './shared/guards/team-access.guard';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { BridgeModule } from './modules/bridge/bridge.module';
import { ChannelModule } from './modules/channel/channel.module';
import { MessageModule } from './modules/message/message.module';
import { PresenceModule } from './modules/presence/presence.module';
import { GithubModule } from './modules/github/github.module';
import { IssueModule } from './modules/issue/issue.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { DocumentModule } from './modules/document/document.module';
import { DiscordModule } from './modules/discord/discord.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthController } from './shared/http/health.controller';

/**
 * Slacord 앱 루트 모듈
 * - 팀 협업 툴 + 외부 브리지 worker
 * - 모든 데이터는 MongoDB에 직접 저장
 * - 실시간 채팅은 Socket.IO WebSocket으로 처리
 */
@Module({
    controllers: [HealthController],
    providers: [
        { provide: APP_GUARD, useClass: TeamAccessGuard },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        EventEmitterModule.forRoot({ wildcard: false, maxListeners: 20 }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI') ?? 'mongodb://localhost:27017/slacord',
            }),
            inject: [ConfigService],
        }),
        DiscordModule,
        AuthModule,
        TeamModule,
        BridgeModule,
        ChannelModule,
        MessageModule,
        PresenceModule,
        GithubModule,
        IssueModule,
        AnnouncementModule,
        DocumentModule,
        NotificationModule,
    ],
})
export class AppModule {}
