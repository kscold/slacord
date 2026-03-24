import { TeamEntity, TeamInviteLink, TeamMember, GitHubConfig } from './team.entity';

export interface ITeamRepository {
    findById(id: string): Promise<TeamEntity | null>;
    findBySlug(slug: string): Promise<TeamEntity | null>;
    findByInviteCode(code: string): Promise<TeamEntity | null>;
    findByGithubRepo(repoFullName: string): Promise<TeamEntity | null>;
    findByMember(userId: string): Promise<TeamEntity[]>;
    save(data: {
        name: string;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        members: TeamMember[];
        inviteLinks?: TeamInviteLink[];
    }): Promise<TeamEntity>;
    addMember(teamId: string, member: TeamMember): Promise<TeamEntity>;
    replaceAccess(teamId: string, members: TeamMember[], inviteLinks: TeamInviteLink[]): Promise<TeamEntity | null>;
    existsBySlug(slug: string): Promise<boolean>;
    updateGithubConfig(teamId: string, config: GitHubConfig): Promise<TeamEntity | null>;
}

export const TEAM_REPOSITORY = Symbol('ITeamRepository');
