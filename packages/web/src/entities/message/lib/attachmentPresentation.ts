import type { Attachment } from '../types';

export type AttachmentKind = 'image' | 'video' | 'audio' | 'other';

export function getAttachmentKind(input: Pick<Attachment, 'mimeType' | 'name'> | Pick<File, 'type' | 'name'>): AttachmentKind {
    const mimeType = 'mimeType' in input ? input.mimeType : input.type;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    const lowerName = input.name.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(lowerName)) return 'image';
    if (/\.(mp4|webm|mov|m4v|ogg)$/.test(lowerName)) return 'video';
    if (/\.(mp3|wav|m4a|aac|flac|oga)$/.test(lowerName)) return 'audio';
    return 'other';
}

export function formatAttachmentSize(size: number) {
    if (size >= 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)}MB`;
    }
    return `${Math.max(1, Math.round(size / 1024))}KB`;
}
