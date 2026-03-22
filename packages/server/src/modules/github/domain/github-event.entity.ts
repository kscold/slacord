export type GitHubEventType =
    | 'pr_opened'
    | 'pr_merged'
    | 'pr_closed'
    | 'pr_review_requested'
    | 'pr_approved'
    | 'pr_changes_requested'
    | 'ci_passed'
    | 'ci_failed';

/** GitHub 이벤트 도메인 엔티티 */
export class GitHubEventEntity {
    constructor(
        public readonly eventType: GitHubEventType,
        public readonly repoName: string,
        public readonly prNumber: number | null,
        public readonly title: string,
        public readonly url: string,
        public readonly actor: string,
        public readonly extra: Record<string, string>,
    ) {}

    /** 채팅 채널에 표시할 카드 내용 생성 */
    toCardContent(): string {
        switch (this.eventType) {
            case 'pr_opened':
                return `[PR #${this.prNumber}] ${this.title} — opened by ${this.actor}`;
            case 'pr_merged':
                return `[PR #${this.prNumber}] ${this.title} — merged by ${this.actor}`;
            case 'pr_closed':
                return `[PR #${this.prNumber}] ${this.title} — closed by ${this.actor}`;
            case 'pr_review_requested':
                return `[PR #${this.prNumber}] ${this.title} — review requested from ${this.extra.reviewer ?? 'someone'}`;
            case 'pr_approved':
                return `[PR #${this.prNumber}] ${this.title} — approved by ${this.actor}`;
            case 'pr_changes_requested':
                return `[PR #${this.prNumber}] ${this.title} — changes requested by ${this.actor}`;
            case 'ci_passed':
                return `[CI] ${this.repoName} — build passed`;
            case 'ci_failed':
                return `[CI] ${this.repoName} — build failed`;
            default:
                return `[GitHub] ${this.title}`;
        }
    }
}
