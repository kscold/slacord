import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './infrastructure/persistence/team.schema';
import { TeamRepository } from './infrastructure/persistence/team.repository';
import { TEAM_REPOSITORY } from './domain/team.port';
import { CreateInviteLinkUseCase } from './application/use-cases/create-invite-link.use-case';
import { CreateTeamUseCase } from './application/use-cases/create-team.use-case';
import { GetInviteLinksUseCase } from './application/use-cases/get-invite-links.use-case';
import { GetInvitePreviewUseCase } from './application/use-cases/get-invite-preview.use-case';
import { GetTeamUseCase } from './application/use-cases/get-team.use-case';
import { GetTeamsUseCase } from './application/use-cases/get-teams.use-case';
import { GetTeamMembersUseCase } from './application/use-cases/get-team-members.use-case';
import { JoinTeamByInviteUseCase } from './application/use-cases/join-team-by-invite.use-case';
import { JoinTeamUseCase } from './application/use-cases/join-team.use-case';
import { RevokeInviteLinkUseCase } from './application/use-cases/revoke-invite-link.use-case';
import { UpdateGithubConfigUseCase } from './application/use-cases/update-github-config.use-case';
import { UpdateMemberAccessUseCase } from './application/use-cases/update-member-access.use-case';
import { TeamInviteController } from './infrastructure/http/team-invite.controller';
import { TeamController } from './infrastructure/http/team.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }])],
    controllers: [TeamController, TeamInviteController],
    providers: [
        { provide: TEAM_REPOSITORY, useClass: TeamRepository },
        CreateTeamUseCase,
        GetTeamUseCase,
        GetTeamsUseCase,
        GetTeamMembersUseCase,
        JoinTeamUseCase,
        UpdateGithubConfigUseCase,
        GetInviteLinksUseCase,
        CreateInviteLinkUseCase,
        RevokeInviteLinkUseCase,
        GetInvitePreviewUseCase,
        JoinTeamByInviteUseCase,
        UpdateMemberAccessUseCase,
    ],
    exports: [TEAM_REPOSITORY],
})
export class TeamModule {}
