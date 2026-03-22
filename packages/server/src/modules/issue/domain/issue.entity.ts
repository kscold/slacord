export type IssueStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

/** 이슈 트래커 도메인 엔티티 */
export class IssueEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly title: string,
        public readonly description: string,
        public readonly status: IssueStatus,
        public readonly priority: IssuePriority,
        public readonly assigneeIds: string[],
        public readonly labels: string[],
        public readonly createdBy: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            assigneeIds: this.assigneeIds,
            labels: this.labels,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
