import { describe, expect, it } from 'vitest';
import { formatAttachmentSize, getAttachmentKind } from './attachmentPresentation';

describe('attachmentPresentation', () => {
    it('mime type으로 이미지와 비디오를 구분한다', () => {
        expect(getAttachmentKind({ name: 'photo.png', mimeType: 'image/png' })).toBe('image');
        expect(getAttachmentKind({ name: 'clip.mp4', mimeType: 'video/mp4' })).toBe('video');
        expect(getAttachmentKind({ name: 'voice.mp3', mimeType: 'audio/mpeg' })).toBe('audio');
    });

    it('mime type이 없어도 파일명 확장자로 fallback한다', () => {
        expect(getAttachmentKind({ name: 'preview.webp', mimeType: '' })).toBe('image');
        expect(getAttachmentKind({ name: 'movie.mov', mimeType: '' })).toBe('video');
        expect(getAttachmentKind({ name: 'notes.txt', mimeType: '' })).toBe('other');
    });

    it('파일 크기를 사람이 읽기 쉬운 문자열로 만든다', () => {
        expect(formatAttachmentSize(900)).toBe('1KB');
        expect(formatAttachmentSize(2048)).toBe('2KB');
        expect(formatAttachmentSize(3 * 1024 * 1024)).toBe('3.0MB');
    });
});
