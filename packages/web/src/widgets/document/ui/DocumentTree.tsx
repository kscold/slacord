'use client';

import { useMemo, useState } from 'react';
import { buildDocumentTree, type DocumentTreeNode } from '@/src/entities/document/lib/buildDocumentTree';
import { collectExpandedIds, filterDocumentTree } from '@/src/entities/document/lib/filterDocumentTree';
import type { DocumentNode } from '@/src/entities/document/types';
import { DocumentTreeBranch } from './DocumentTreeBranch';
import { DocumentTreeSearch } from './DocumentTreeSearch';

interface Props {
    documents: DocumentNode[];
    teamId: string;
}

export function DocumentTree({ documents, teamId }: Props) {
    const roots = buildDocumentTree(documents);
    const [query, setQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const filteredRoots = useMemo(() => filterDocumentTree(roots, query), [query, roots]);
    const visibleExpandedIds = useMemo(() => query.trim() ? collectExpandedIds(filteredRoots) : expandedIds, [expandedIds, filteredRoots, query]);

    if (roots.length === 0) {
        return <p className="py-12 text-center text-sm text-text-tertiary">문서가 없습니다. 첫 문서를 만들어 보세요.</p>;
    }

    return (
        <div className="space-y-4">
            <DocumentTreeSearch onChange={setQuery} query={query} />
            {filteredRoots.length === 0 ? (
                <p className="rounded-2xl border border-border-primary bg-bg-secondary px-4 py-6 text-center text-sm text-text-tertiary">검색 조건에 맞는 문서를 찾지 못했습니다.</p>
            ) : (
                <div className="space-y-2">
                    {filteredRoots.map((node) => (
                        <DocumentTreeBranch
                            key={node.id}
                            depth={0}
                            expandedIds={visibleExpandedIds}
                            node={node}
                            onToggle={(id) => setExpandedIds((prev) => toggleExpanded(prev, id))}
                            teamId={teamId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function toggleExpanded(current: Set<string>, id: string) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
}
