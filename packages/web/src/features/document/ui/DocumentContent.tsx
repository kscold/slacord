'use client';

import dynamic from 'next/dynamic';
import type { DocumentFull } from '@/src/entities/document/types';
import { renderDocumentContent } from '@/src/entities/document/lib/renderDocumentContent';

const BlockEditor = dynamic(() => import('./BlockEditor').then((m) => ({ default: m.BlockEditor })), { ssr: false });

interface Props {
    doc: DocumentFull;
}

export function DocumentContent({ doc }: Props) {
    if (!doc.content) return <p className="text-sm text-text-tertiary">내용이 없습니다. 편집 버튼을 눌러 내용을 추가하세요.</p>;

    if (doc.contentFormat === 'json') {
        return <BlockEditor teamId={doc.teamId} initialContent={doc.content} onChange={() => {}} editable={false} />;
    }

    const rendered = renderDocumentContent(doc);
    return <div className="confluence-render overflow-x-hidden text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
