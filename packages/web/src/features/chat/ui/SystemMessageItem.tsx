import { GitHubEventCard } from './GitHubEventCard';
import type { GitHubEventMeta, Message } from '@/src/entities/message/types';

function parseGitHubMeta(content: string): GitHubEventMeta | null {
    const match = content.match(/<!--github:(.+?)-->/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]) as GitHubEventMeta;
    } catch {
        return null;
    }
}

interface Props {
    message: Message;
}

export function SystemMessageItem({ message }: Props) {
    const meta = parseGitHubMeta(message.content);
    if (meta) return <GitHubEventCard meta={meta} />;

    return (
        <div className="py-2 text-center text-xs text-text-tertiary">
            {message.content.replace(/<!--github:.+?-->/, '')}
        </div>
    );
}
