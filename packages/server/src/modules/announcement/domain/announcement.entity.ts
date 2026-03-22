/** 공지사항 도메인 엔티티 */
export class AnnouncementEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly isPinned: boolean,
        public readonly createdBy: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            title: this.title,
            content: this.content,
            isPinned: this.isPinned,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
