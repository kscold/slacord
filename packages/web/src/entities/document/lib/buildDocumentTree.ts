import type { DocumentNode } from '../types';

export interface DocumentTreeNode extends DocumentNode {
    children: DocumentTreeNode[];
}

export function buildDocumentTree(documents: DocumentNode[]) {
    const nodes = new Map<string, DocumentTreeNode>(
        documents.map((document) => [document.id, { ...document, children: [] }] as const),
    );
    const roots: DocumentTreeNode[] = [];

    for (const node of nodes.values()) {
        if (node.parentId && nodes.has(node.parentId)) {
            nodes.get(node.parentId)?.children.push(node);
            continue;
        }
        roots.push(node);
    }

    return roots;
}
