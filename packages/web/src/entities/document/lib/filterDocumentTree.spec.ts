import { collectExpandedIds, filterDocumentTree } from './filterDocumentTree';
import type { DocumentTreeNode } from './buildDocumentTree';

function makeTree(): DocumentTreeNode[] {
    return [
        {
            id: 'root',
            teamId: 'team-1',
            title: '회의록',
            contentFormat: 'json',
            parentId: null,
            createdBy: 'user-1',
            updatedBy: 'user-1',
            visibility: 'team',
            editPolicy: 'owner_admin',
            archivedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: [
                {
                    id: 'child',
                    teamId: 'team-1',
                    title: '로그인 개선',
                    contentFormat: 'json',
                    parentId: 'root',
                    createdBy: 'user-1',
                    updatedBy: 'user-1',
                    visibility: 'team',
                    editPolicy: 'owner_admin',
                    archivedAt: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    children: [],
                },
            ],
        },
    ];
}

describe('filterDocumentTree', () => {
    it('검색어가 없으면 원본 트리를 그대로 돌려줌', () => {
        const tree = makeTree();

        expect(filterDocumentTree(tree, '')).toBe(tree);
    });

    it('자식이 일치하면 부모를 남기고 자식만 유지함', () => {
        const result = filterDocumentTree(makeTree(), '로그인');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('root');
        expect(result[0].children.map((child) => child.id)).toEqual(['child']);
    });

    it('확장 ID는 자식이 있는 노드만 모음', () => {
        const expanded = collectExpandedIds(makeTree());

        expect(Array.from(expanded)).toEqual(['root']);
    });
});
