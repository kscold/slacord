import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './infrastructure/persistence/team.schema';
import { TeamRepository } from './infrastructure/persistence/team.repository';
import { TEAM_REPOSITORY } from './domain/team.port';
import { CreateTeamUseCase } from './application/use-cases/create-team.use-case';
import { GetTeamsUseCase } from './application/use-cases/get-teams.use-case';
import { GetTeamMembersUseCase } from './application/use-cases/get-team-members.use-case';
import { JoinTeamUseCase } from './application/use-cases/join-team.use-case';
import { UpdateGithubConfigUseCase } from './application/use-cases/update-github-config.use-case';
import { TeamController } from './infrastructure/http/team.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }])],
    controllers: [TeamController],
    providers: [
        { provide: TEAM_REPOSITORY, useClass: TeamRepository },
        CreateTeamUseCase,
        GetTeamsUseCase,
        GetTeamMembersUseCase,
        JoinTeamUseCase,
        UpdateGithubConfigUseCase,
    ],
    exports: [TEAM_REPOSITORY],
})
export class TeamModule {}
