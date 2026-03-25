'use client';

import { useState } from 'react';
import type { BlockNoteEditor } from '@blocknote/core';
import { documentApi } from '@/lib/api-client';

interface Props {
    documentId: string;
    editor: BlockNoteEditor;
    onUploaded: (content: string) => void;
    teamId: string;
}

export function DocumentAttachmentButton({ documentId, editor, onUploaded, teamId }: Props) {
    const [uploading, setUploading] = useState(false);

    const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const response = await documentApi.uploadDocumentFile(teamId, documentId, file);
            const data = response.data as { name: string; url: string } | undefined;
            if (!data?.url) throw new Error('파일 업로드에 실패했습니다.');
            const escapedName = data.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const blocks = editor.tryParseHTMLToBlocks(`<p><a href="${data.url}" target="_blank" rel="noreferrer">${escapedName}</a></p>`);
            const anchor = editor.document.at(-1);
            if (anchor) editor.insertBlocks(blocks, anchor, 'after');
            onUploaded(editor.blocksToFullHTML());
        } catch (error) {
            alert(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border-primary px-3 py-2 text-xs font-medium text-text-secondary transition hover:text-white hover:bg-bg-hover">
            {uploading ? '업로드 중...' : '파일 첨부'}
            <input type="file" className="hidden" onChange={handleSelect} disabled={uploading} />
        </label>
    );
}
