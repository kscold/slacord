import { buildDocumentTree } from './buildDocumentTree';
import type { DocumentNode } from '../types';

function makeNode(id: string, parentId: string | null = null): DocumentNode {
    return {
        id,
        teamId: 'team-1',
        title: `문서 ${id}`,
        contentFormat: 'json',
        parentId,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        visibility: 'team',
        editPolicy: 'owner_admin',
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

describe('buildDocumentTree', () => {
    it('부모-자식 구조로 트리를 만듦', () => {
        const result = buildDocumentTree([
            makeNode('parent'),
            makeNode('child-1', 'parent'),
            makeNode('child-2', 'parent'),
            makeNode('root-2'),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('parent');
        expect(result[0].children.map((child) => child.id)).toEqual(['child-1', 'child-2']);
        expect(result[1].id).toBe('root-2');
    });

    it('부모를 찾지 못하면 루트로 남김', () => {
        const result = buildDocumentTree([makeNode('orphan', 'missing-parent')]);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('orphan');
    });
});
