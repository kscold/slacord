'use client';

import { useEffect, useMemo } from 'react';
import type { BlockNoteEditor } from '@blocknote/core';
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
import { documentApi } from '@/lib/api-client';

interface Props {
    teamId: string;
    initialContent?: string;
    onChange: (json: string) => void;
    editable?: boolean;
}

function parseBlocks(content: string) {
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
        return undefined;
    }
}

export function BlockEditor({ teamId, initialContent, onChange, editable = true }: Props) {
    const initialBlocks = useMemo(() => parseBlocks(initialContent ?? ''), [initialContent]);
    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialBlocks,
        uploadFile: async (file: File) => {
            const res = await documentApi.uploadDocumentImage(teamId, file);
            if (res.success && res.data?.url) return res.data.url;
            throw new Error('이미지 업로드에 실패했습니다.');
        },
    });

    useEffect(() => {
        if (!editable) return;
        const handler = () => {
            onChange(JSON.stringify(editor.document));
        };
        editor.onEditorContentChange(handler);
    }, [editor, editable, onChange]);

    return (
        <div className="rounded-xl border border-border-primary bg-bg-secondary">
            <BlockNoteViewRaw editor={editor} editable={editable} className="slacord-blocknote" theme="dark" />
        </div>
    );
}
