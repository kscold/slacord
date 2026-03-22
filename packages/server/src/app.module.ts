import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { ChannelModule } from './modules/channel/channel.module';
import { MessageModule } from './modules/message/message.module';

/**
 * Slacord 앱 루트 모듈
 * - 순수 팀 협업 툴 (Slack/Discord relay 없음)
 * - 모든 데이터는 MongoDB에 직접 저장
 * - 실시간 채팅은 Socket.IO WebSocket으로 처리
 */
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI') ?? 'mongodb://localhost:27017/slacord',
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        TeamModule,
        ChannelModule,
        MessageModule,
    ],
})
export class AppModule {}
