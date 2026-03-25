'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildDocumentTree, type DocumentTreeNode } from '@/src/entities/document/lib/buildDocumentTree';
import type { DocumentNode } from '@/src/entities/document/types';

interface Props {
    documents: DocumentNode[];
    teamId: string;
}

export function DocumentTree({ documents, teamId }: Props) {
    const roots = buildDocumentTree(documents);
    if (roots.length === 0) return <p className="py-12 text-center text-sm text-text-tertiary">문서가 없습니다. 첫 문서를 만들어 보세요.</p>;
    return <div className="space-y-2">{roots.map((node) => <TreeBranch key={node.id} node={node} teamId={teamId} depth={0} />)}</div>;
}

function TreeBranch({ node, teamId, depth }: { node: DocumentTreeNode; teamId: string; depth: number }) {
    const hasChildren = node.children.length > 0;
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div>
            <div className="flex items-center gap-1" style={{ marginLeft: `${depth * 14}px` }}>
                {hasChildren ? (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="shrink-0 rounded p-1 text-text-tertiary transition hover:bg-bg-hover hover:text-white"
                    >
                        <svg className={`h-3.5 w-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <Link href={`/${teamId}/docs/${node.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary p-4 transition-all hover:border-brand-400/30 hover:bg-bg-hover">
                    <span className="text-text-tertiary">{hasChildren ? '📁' : '📄'}</span>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-white">{node.title}</p>
                        <p className="text-xs text-text-tertiary">{new Date(node.updatedAt).toLocaleDateString('ko-KR')} 수정</p>
                    </div>
                </Link>
            </div>
            {hasChildren && !collapsed && (
                <div className="mt-2 space-y-2">
                    {node.children.map((child) => <TreeBranch key={child.id} node={child} teamId={teamId} depth={depth + 1} />)}
                </div>
            )}
        </div>
    );
}
