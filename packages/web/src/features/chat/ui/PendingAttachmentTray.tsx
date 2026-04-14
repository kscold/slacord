'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatAttachmentSize, getAttachmentKind } from '@/src/entities/message/lib/attachmentPresentation';

interface Props {
    files: File[];
    onRemove: (index: number) => void;
}

interface PreviewItem {
    file: File;
    index: number;
    kind: ReturnType<typeof getAttachmentKind>;
    url: string | null;
}

export function PendingAttachmentTray({ files, onRemove }: Props) {
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        const urls = files.map((file) => {
            const kind = getAttachmentKind(file);
            return kind === 'image' || kind === 'video' ? URL.createObjectURL(file) : '';
        });
        setPreviewUrls(urls);
        return () => {
            urls.filter(Boolean).forEach((url) => URL.revokeObjectURL(url));
        };
    }, [files]);

    const previews = useMemo<PreviewItem[]>(
        () =>
            files.map((file, index) => ({
                file,
                index,
                kind: getAttachmentKind(file),
                url: previewUrls[index] || null,
            })),
        [files, previewUrls],
    );

    if (previews.length === 0) return null;

    return (
        <div className="border-b border-border-primary/80 px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d6b08a]">업로드 준비</p>
                <p className="text-xs text-text-tertiary">{previews.length}개 파일</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {previews.map((preview) => (
                    <div key={`${preview.file.name}-${preview.file.size}-${preview.index}`} className="overflow-hidden rounded-2xl border border-border-primary bg-black/20">
                        <div className="relative aspect-[4/3] bg-[#120f0b]">
                            {preview.kind === 'image' && preview.url ? (
                                <img src={preview.url} alt={preview.file.name} className="h-full w-full object-cover" />
                            ) : preview.kind === 'video' && preview.url ? (
                                <video src={preview.url} className="h-full w-full object-cover" muted playsInline />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                                    {preview.kind}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(preview.index)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                                aria-label={`${preview.file.name} 제거`}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-1 px-3 py-2.5">
                            <p className="truncate text-sm font-medium text-white">{preview.file.name}</p>
                            <p className="text-xs text-text-tertiary">{formatAttachmentSize(preview.file.size)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
