'use client';

import Link from 'next/link';
import type { DocumentTreeNode } from '@/src/entities/document/lib/buildDocumentTree';

interface Props {
    depth: number;
    expandedIds: Set<string>;
    node: DocumentTreeNode;
    onToggle: (id: string) => void;
    teamId: string;
}

export function DocumentTreeBranch({ depth, expandedIds, node, onToggle, teamId }: Props) {
    const hasChildren = node.children.length > 0;
    const expanded = expandedIds.has(node.id);

    return (
        <div>
            <div className="flex items-center gap-1" style={{ marginLeft: `${depth * 14}px` }}>
                {hasChildren ? (
                    <button onClick={() => onToggle(node.id)} className="shrink-0 rounded p-1 text-text-tertiary transition hover:bg-bg-hover hover:text-white">
                        <svg className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {hasChildren && expanded ? (
                <div className="mt-2 space-y-2">
                    {node.children.map((child) => (
                        <DocumentTreeBranch
                            key={child.id}
                            depth={depth + 1}
                            expandedIds={expandedIds}
                            node={child}
                            onToggle={onToggle}
                            teamId={teamId}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
