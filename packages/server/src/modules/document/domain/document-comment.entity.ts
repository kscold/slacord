export class DocumentCommentEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly documentId: string,
        public readonly parentId: string | null,
        public readonly content: string,
        public readonly anchorText: string | null,
        public readonly createdBy: string,
        public readonly resolvedAt: Date | null,
        public readonly resolvedBy: string | null,
        public readonly editedAt: Date | null,
        public readonly deletedAt: Date | null,
        public readonly deletedBy: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    get isResolved() {
        return this.resolvedAt !== null;
    }

    get isEdited() {
        return this.editedAt !== null;
    }

    get isDeleted() {
        return this.deletedAt !== null;
    }

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            documentId: this.documentId,
            parentId: this.parentId,
            content: this.content,
            anchorText: this.anchorText,
            createdBy: this.createdBy,
            resolvedAt: this.resolvedAt?.toISOString() ?? null,
            resolvedBy: this.resolvedBy,
            editedAt: this.editedAt?.toISOString() ?? null,
            deletedAt: this.deletedAt?.toISOString() ?? null,
            deletedBy: this.deletedBy,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}
