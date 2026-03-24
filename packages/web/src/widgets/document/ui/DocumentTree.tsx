import Link from 'next/link';
import { buildDocumentTree, type DocumentTreeNode } from '@/src/entities/document/lib/buildDocumentTree';
import type { DocumentNode } from '@/src/entities/document/types';

interface Props {
    documents: DocumentNode[];
    teamId: string;
}

export function DocumentTree({ documents, teamId }: Props) {
    const roots = buildDocumentTree(documents);
    if (roots.length === 0) return <p className="py-12 text-center text-sm text-text-tertiary">문서가 없습니다. 첫 문서를 만들거나 Confluence에서 가져오세요.</p>;
    return <div className="space-y-2">{roots.map((node) => <TreeBranch key={node.id} node={node} teamId={teamId} depth={0} />)}</div>;
}

function TreeBranch({ node, teamId, depth }: { node: DocumentTreeNode; teamId: string; depth: number }) {
    return (
        <div className="space-y-2">
            <Link href={`/${teamId}/docs/${node.id}`} className="flex items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary p-4 transition-all hover:border-brand-400/30 hover:bg-bg-hover" style={{ marginLeft: `${depth * 14}px` }}>
                <span className="text-text-tertiary">{node.children.length > 0 ? '📁' : '📄'}</span>
                <div className="min-w-0">
                    <p className="truncate font-medium text-white">{node.title}</p>
                    <p className="text-xs text-text-tertiary">{new Date(node.updatedAt).toLocaleDateString('ko-KR')} 수정</p>
                </div>
            </Link>
            {node.children.map((child) => <TreeBranch key={child.id} node={child} teamId={teamId} depth={depth + 1} />)}
        </div>
    );
}
