export function normalizeGitHubRepo(input: string): string | null {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed) return null;
    if (trimmed.startsWith('git@github.com:')) {
        return toRepoName(trimmed.slice('git@github.com:'.length));
    }
    if (/^[\w.-]+\/[\w.-]+(?:\.git)?$/.test(trimmed)) {
        return toRepoName(trimmed);
    }
    try {
        const url = new URL(trimmed);
        if (!['github.com', 'www.github.com'].includes(url.hostname)) return null;
        return toRepoName(url.pathname);
    } catch {
        return null;
    }
}

function toRepoName(value: string) {
    const [owner, repo] = value.split('/').filter(Boolean);
    if (!owner || !repo) return null;
    return `${owner}/${repo.replace(/\.git$/, '')}`;
}
