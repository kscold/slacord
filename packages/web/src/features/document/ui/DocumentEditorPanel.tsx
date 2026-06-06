'use client';

import { useEffect, useRef } from 'react';
import type { BlockNoteEditor } from '@blocknote/core';
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
import { documentApi, unwrapApiData } from '@/lib/api-client';
import { DocumentAttachmentButton } from './DocumentAttachmentButton';

interface Props {
    contentFormat: 'plain' | 'html' | 'json';
    documentId: string;
    initialContent: string;
    onChange: (content: string) => void;
    syncKey: string;
    teamId: string;
}

export function DocumentEditorPanel({ contentFormat, documentId, initialContent, onChange, syncKey, teamId }: Props) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const editor = useCreateBlockNote({
        initialContent: [{ type: 'paragraph' }],
        uploadFile: async (file) => {
            const url = unwrapApiData<{ url: string }>(await documentApi.uploadDocumentImage(teamId, file))?.url;
            if (!url) throw new Error('이미지 업로드에 실패했습니다.');
            return url;
        },
    }, [teamId]);

    useEffect(() => {
        syncEditor(editor, initialContent, contentFormat);
    }, [contentFormat, editor, initialContent, syncKey]);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Rich Editor</p>
                <DocumentAttachmentButton documentId={documentId} editor={editor} onUploaded={onChange} teamId={teamId} />
            </div>
            <div className="rounded-2xl border border-border-primary bg-bg-secondary">
                <BlockNoteViewRaw
                    editor={editor}
                    className="slacord-blocknote"
                    theme="dark"
                    onChange={() => onChangeRef.current(contentFormat === 'json' ? JSON.stringify(editor.document) : editor.blocksToFullHTML())}
                />
            </div>
        </div>
    );
}

function syncEditor(editor: BlockNoteEditor, content: string, contentFormat: 'plain' | 'html' | 'json') {
    const fallback = editor.tryParseHTMLToBlocks('<p></p>');
    if (contentFormat === 'json' && content.trim()) {
        try {
            const blocks = JSON.parse(content);
            if (Array.isArray(blocks) && blocks.length > 0) {
                editor.replaceBlocks(editor.document, blocks);
                return;
            }
        } catch { /* fall through to html/plain */ }
    }
    const nextBlocks = !content.trim()
        ? fallback
        : contentFormat === 'html'
          ? editor.tryParseHTMLToBlocks(content)
          : editor.tryParseMarkdownToBlocks(content);
    editor.replaceBlocks(editor.document, nextBlocks.length > 0 ? nextBlocks : fallback);
}
