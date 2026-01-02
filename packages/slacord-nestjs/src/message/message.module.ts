import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message, MessageSchema } from '../schema/message.schema';
import { Team, TeamSchema } from '../schema/team.schema';
import { SlackModule } from '../slack/slack.module';
import { DiscordModule } from '../discord/discord.module';
import { AuthModule } from '../auth/auth.module';

/**
 * 메시지 모듈 (중앙집중식 MVP)
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: Team.name, schema: TeamSchema },
        ]),
        SlackModule,
        DiscordModule,
        AuthModule, // JWT 인증을 위한 AuthModule import
    ],
    controllers: [MessageController],
    providers: [MessageService],
    exports: [MessageService],
})
export class MessageModule {}
