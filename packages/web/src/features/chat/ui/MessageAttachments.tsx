'use client';

import type { Attachment } from '@/src/entities/message/types';
import { formatAttachmentSize, getAttachmentKind } from '@/src/entities/message/lib/attachmentPresentation';

interface Props {
    attachments: Attachment[];
}

export function MessageAttachments({ attachments }: Props) {
    if (attachments.length === 0) {
        return null;
    }

    const mediaAttachments = attachments.filter((attachment) => getAttachmentKind(attachment) !== 'other');
    const otherAttachments = attachments.filter((attachment) => getAttachmentKind(attachment) === 'other');

    return (
        <div className="mt-2 space-y-3">
            {mediaAttachments.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                    {mediaAttachments.map((attachment) => (
                        <MediaAttachmentCard key={attachment.url} attachment={attachment} />
                    ))}
                </div>
            ) : null}
            <div className="flex flex-col gap-2">
            {otherAttachments.map((attachment) => (
                <a
                    key={attachment.url}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-primary bg-black/20 px-3 py-2 text-sm text-text-secondary transition-colors hover:border-slack-green/40 hover:text-white"
                >
                    <span className="truncate">{attachment.name}</span>
                    <span className="shrink-0 text-xs text-text-tertiary">{formatAttachmentSize(attachment.size)}</span>
                </a>
            ))}
            </div>
        </div>
    );
}

function MediaAttachmentCard({ attachment }: { attachment: Attachment }) {
    const kind = getAttachmentKind(attachment);

    return (
        <div className="overflow-hidden rounded-2xl border border-border-primary bg-black/20">
            <a href={attachment.url} target="_blank" rel="noreferrer" className="block bg-[#120f0b]">
                {kind === 'image' ? (
                    <img src={attachment.url} alt={attachment.name} className="h-56 w-full object-cover" loading="lazy" />
                ) : kind === 'video' ? (
                    <video src={attachment.url} controls preload="metadata" className="h-56 w-full bg-black object-cover" />
                ) : kind === 'audio' ? (
                    <div className="flex h-28 items-center px-4">
                        <audio src={attachment.url} controls className="w-full" preload="metadata" />
                    </div>
                ) : null}
            </a>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <a href={attachment.url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-white hover:text-[#d6b08a]">
                    {attachment.name}
                </a>
                <span className="shrink-0 text-xs text-text-tertiary">{formatAttachmentSize(attachment.size)}</span>
            </div>
        </div>
    );
}
