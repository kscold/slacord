import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RelayService } from './relay.service';
import { Message, MessageSchema } from '../schema/message.schema';
import { Team, TeamSchema } from '../schema/team.schema';
import { SlackModule } from '../slack/slack.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: Team.name, schema: TeamSchema },
        ]),
        SlackModule,
        DiscordModule,
    ],
    providers: [RelayService],
    exports: [RelayService],
})
export class RelayModule {}
