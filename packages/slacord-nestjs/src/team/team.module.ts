import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { Team, TeamSchema } from './team.schema';
import { Room, RoomSchema } from './room.schema';
import { User, UserSchema } from '../user/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Team.name, schema: TeamSchema },
            { name: Room.name, schema: RoomSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}
