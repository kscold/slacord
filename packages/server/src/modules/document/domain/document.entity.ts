/** 문서/위키 도메인 엔티티 (Markdown, 트리 구조 지원) */
export class DocumentEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly parentId: string | null,
        public readonly createdBy: string,
        public readonly updatedBy: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            title: this.title,
            content: this.content,
            parentId: this.parentId,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
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
            parentId: this.parentId,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
