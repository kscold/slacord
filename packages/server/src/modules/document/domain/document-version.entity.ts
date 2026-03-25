export class DocumentVersionEntity {
    constructor(
        public readonly id: string,
        public readonly documentId: string,
        public readonly teamId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly contentFormat: 'plain' | 'html' | 'json',
        public readonly savedBy: string,
        public readonly createdAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            documentId: this.documentId,
            teamId: this.teamId,
            title: this.title,
            content: this.content,
            contentFormat: this.contentFormat,
            savedBy: this.savedBy,
            createdAt: this.createdAt,
        };
    }
}
