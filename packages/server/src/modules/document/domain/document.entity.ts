export type DocVisibility = 'team' | 'restricted';
export type DocEditPolicy = 'owner_admin' | 'all' | 'restricted';

/** 문서/위키 도메인 엔티티 (Markdown, 트리 구조 지원) */
export class DocumentEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly contentFormat: 'plain' | 'html' | 'json',
        public readonly parentId: string | null,
        public readonly createdBy: string,
        public readonly updatedBy: string,
        public readonly externalSource: string | null,
        public readonly externalId: string | null,
        public readonly externalUrl: string | null,
        public readonly visibility: DocVisibility,
        public readonly editPolicy: DocEditPolicy,
        public readonly allowedViewerIds: string[],
        public readonly allowedEditorIds: string[],
        public readonly archivedAt: Date | null,
        public readonly archivedBy: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    get isArchived(): boolean {
        return this.archivedAt !== null;
    }

    canView(userId: string, role: string): boolean {
        if (role === 'owner' || role === 'admin') return true;
        if (this.visibility === 'team') return true;
        return this.allowedViewerIds.includes(userId) || this.createdBy === userId;
    }

    canEdit(userId: string, role: string): boolean {
        if (role === 'owner') return true;
        if (this.editPolicy === 'all') return true;
        if (this.editPolicy === 'owner_admin' && (role === 'admin' || this.createdBy === userId)) return true;
        if (this.editPolicy === 'restricted') return this.allowedEditorIds.includes(userId) || this.createdBy === userId;
        return false;
    }

    canDelete(userId: string, role: string): boolean {
        return role === 'owner' || role === 'admin' || this.createdBy === userId;
    }

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            title: this.title,
            content: this.content,
            contentFormat: this.contentFormat,
            parentId: this.parentId,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            externalSource: this.externalSource,
            externalId: this.externalId,
            externalUrl: this.externalUrl,
            visibility: this.visibility,
            editPolicy: this.editPolicy,
            allowedViewerIds: this.allowedViewerIds,
            allowedEditorIds: this.allowedEditorIds,
            archivedAt: this.archivedAt,
            archivedBy: this.archivedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /** 문서 트리 노드용 (content 제외 - 목록에서는 불필요) */
    toTreeNode() {
        return {
            id: this.id,
            teamId: this.teamId,
            title: this.title,
            contentFormat: this.contentFormat,
            parentId: this.parentId,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            visibility: this.visibility,
            editPolicy: this.editPolicy,
            archivedAt: this.archivedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
