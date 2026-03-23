'use client';

import type { Attachment } from '@/src/entities/message/types';

interface Props {
    attachments: Attachment[];
}

export function MessageAttachments({ attachments }: Props) {
    if (attachments.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 flex flex-col gap-2">
            {attachments.map((attachment) => (
                <a
                    key={attachment.url}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-primary bg-black/20 px-3 py-2 text-sm text-text-secondary transition-colors hover:border-slack-green/40 hover:text-white"
                >
                    <span className="truncate">{attachment.name}</span>
                    <span className="shrink-0 text-xs text-text-tertiary">{Math.max(1, Math.round(attachment.size / 1024))}KB</span>
                </a>
            ))}
        </div>
    );
}
