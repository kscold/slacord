import type { DocumentTreeNode } from './buildDocumentTree';

export function filterDocumentTree(nodes: DocumentTreeNode[], query: string): DocumentTreeNode[] {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return nodes;
    return nodes.flatMap((node) => filterNode(node, keyword));
}

export function collectExpandedIds(nodes: DocumentTreeNode[]) {
    const ids = new Set<string>();
    walk(nodes, ids);
    return ids;
}

function filterNode(node: DocumentTreeNode, keyword: string): DocumentTreeNode[] {
    const children = node.children.flatMap((child) => filterNode(child, keyword));
    const matched = node.title.toLowerCase().includes(keyword);
    if (!matched && children.length === 0) return [];
    return [{ ...node, children }];
}

function walk(nodes: DocumentTreeNode[], ids: Set<string>) {
    for (const node of nodes) {
        if (node.children.length === 0) continue;
        ids.add(node.id);
        walk(node.children, ids);
    }
}
