import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SlackModule } from '../slack/slack.module';
import { DiscordModule } from '../discord/discord.module';
import { AuthModule } from '../auth/auth.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { Team, TeamSchema } from '../schema/team.schema';
import { Room, RoomSchema } from '../schema/room.schema';
import { User, UserSchema } from '../schema/user.schema';

/**
 * 팀 모듈
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Team.name, schema: TeamSchema },
            { name: Room.name, schema: RoomSchema },
            { name: User.name, schema: UserSchema },
        ]),
        SlackModule,
        DiscordModule,
        AuthModule, // JWT 인증을 위한 AuthModule import
    ],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}
