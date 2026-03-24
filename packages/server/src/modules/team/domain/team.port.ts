import { TeamEntity, TeamMember, GitHubConfig } from './team.entity';

export interface ITeamRepository {
    findById(id: string): Promise<TeamEntity | null>;
    findBySlug(slug: string): Promise<TeamEntity | null>;
    findByGithubRepo(repoFullName: string): Promise<TeamEntity | null>;
    findByMember(userId: string): Promise<TeamEntity[]>;
    save(data: {
        name: string;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        members: TeamMember[];
    }): Promise<TeamEntity>;
    addMember(teamId: string, member: TeamMember): Promise<TeamEntity>;
    existsBySlug(slug: string): Promise<boolean>;
    updateGithubConfig(teamId: string, config: GitHubConfig): Promise<TeamEntity | null>;
}

export const TEAM_REPOSITORY = Symbol('ITeamRepository');
