import { IssueEntity, IssueStatus, IssuePriority } from './issue.entity';

export interface IssueSearchFilters {
    status?: IssueStatus;
    query?: string;
    assigneeId?: string;
}

export interface IIssueRepository {
    findByTeam(teamId: string, filters?: IssueSearchFilters): Promise<IssueEntity[]>;
    findById(id: string): Promise<IssueEntity | null>;
    save(data: {
        teamId: string;
        title: string;
        description: string;
        priority: IssuePriority;
        assigneeIds: string[];
        labels: string[];
        createdBy: string;
    }): Promise<IssueEntity>;
    update(id: string, data: Partial<{
        title: string;
        description: string;
        status: IssueStatus;
        priority: IssuePriority;
        assigneeIds: string[];
        labels: string[];
    }>): Promise<IssueEntity | null>;
    deleteById(id: string): Promise<boolean>;
}

export const ISSUE_REPOSITORY = Symbol('IIssueRepository');
