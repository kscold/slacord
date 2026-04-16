'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import type { DocumentFull } from '@/src/entities/document/types';
import { renderDocumentContent } from '@/src/entities/document/lib/renderDocumentContent';

const BlockEditor = dynamic(() => import('./BlockEditor').then((m) => ({ default: m.BlockEditor })), { ssr: false });

interface Props {
    doc: DocumentFull;
    onQuoteSelection?: (quote: string | null) => void;
}

export function DocumentContent({ doc, onQuoteSelection }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleSelectionChange = () => {
        if (!onQuoteSelection || typeof window === 'undefined') return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            onQuoteSelection(null);
            return;
        }

        const container = containerRef.current;
        if (!container) return;

        const range = selection.getRangeAt(0);
        const anchorNode = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentNode
            : range.commonAncestorContainer;

        if (!anchorNode || !container.contains(anchorNode)) {
            onQuoteSelection(null);
            return;
        }

        const normalizedQuote = selection.toString().replace(/\s+/g, ' ').trim();
        onQuoteSelection(normalizedQuote ? normalizedQuote.slice(0, 280) : null);
    };

    if (!doc.content) return <p className="text-sm text-text-tertiary">내용이 없습니다. 편집 버튼을 눌러 내용을 추가하세요.</p>;

    if (doc.contentFormat === 'json') {
        return (
            <div data-testid="document-content" onKeyUp={handleSelectionChange} onMouseUp={handleSelectionChange} ref={containerRef}>
                <BlockEditor teamId={doc.teamId} initialContent={doc.content} onChange={() => {}} editable={false} />
            </div>
        );
    }

    const rendered = renderDocumentContent(doc);
    return (
        <div
            className="confluence-render overflow-x-hidden text-sm text-text-secondary"
            dangerouslySetInnerHTML={{ __html: rendered }}
            data-testid="document-content"
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            ref={containerRef}
        />
    );
}
