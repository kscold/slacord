import type { DocumentFull } from '@/src/entities/document/types';
import { renderDocumentContent } from '@/src/entities/document/lib/renderDocumentContent';

interface Props {
    doc: DocumentFull;
}

export function DocumentContent({ doc }: Props) {
    if (!doc.content) return <p className="text-sm text-text-tertiary">내용이 없습니다. 편집 버튼을 눌러 내용을 추가하세요.</p>;
    const rendered = renderDocumentContent(doc);
    return <div className="confluence-render text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
