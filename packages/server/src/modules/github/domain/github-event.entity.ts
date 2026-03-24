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

    /** Webhook payload로부터 도메인 이벤트 생성 (파싱 불가 시 null) */
    static fromWebhook(eventType: string, body: any): GitHubEventEntity | null {
        const repo: string = body?.repository?.full_name ?? 'unknown';
        const actor: string = body?.sender?.login ?? 'unknown';
        const pr = body?.pull_request;
        const prNumber: number | null = pr?.number ?? null;
        const prTitle: string = pr?.title ?? '';
        const prUrl: string = pr?.html_url ?? '';

        if (eventType === 'pull_request') {
            const action: string = body?.action ?? '';
            if (action === 'opened') return new GitHubEventEntity('pr_opened', repo, prNumber, prTitle, prUrl, actor, {});
            if (action === 'closed' && pr?.merged) return new GitHubEventEntity('pr_merged', repo, prNumber, prTitle, prUrl, actor, {});
            if (action === 'closed' && !pr?.merged) return new GitHubEventEntity('pr_closed', repo, prNumber, prTitle, prUrl, actor, {});
            if (action === 'review_requested') {
                return new GitHubEventEntity('pr_review_requested', repo, prNumber, prTitle, prUrl, actor, { reviewer: body?.requested_reviewer?.login ?? '' });
            }
        }

        if (eventType === 'pull_request_review') {
            const state: string = body?.review?.state ?? '';
            const type: GitHubEventType = state === 'approved' ? 'pr_approved' : 'pr_changes_requested';
            return new GitHubEventEntity(type, repo, prNumber, prTitle, prUrl, actor, {});
        }

        if (eventType === 'check_run') {
            const conclusion: string = body?.check_run?.conclusion ?? '';
            if (conclusion === 'success') return new GitHubEventEntity('ci_passed', repo, null, repo, '', actor, {});
            if (conclusion === 'failure') return new GitHubEventEntity('ci_failed', repo, null, repo, '', actor, {});
        }

        return null;
    }

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
