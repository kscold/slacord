import { TeamEntity, TeamMember } from './team.entity';

export interface ITeamRepository {
    findById(id: string): Promise<TeamEntity | null>;
    findBySlug(slug: string): Promise<TeamEntity | null>;
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
}

export const TEAM_REPOSITORY = Symbol('ITeamRepository');
