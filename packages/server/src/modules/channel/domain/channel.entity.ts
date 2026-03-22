export type ChannelType = 'public' | 'private';

/** 채팅 채널 도메인 엔티티 */
export class ChannelEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly name: string,
        public readonly description: string | null,
        public readonly type: ChannelType,
        public readonly createdBy: string,
        public readonly memberIds: string[],
        public readonly createdAt: Date,
    ) {}

    isMember(userId: string): boolean {
        return this.memberIds.includes(userId);
    }

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            name: this.name,
            description: this.description,
            type: this.type,
            memberCount: this.memberIds.length,
            createdAt: this.createdAt,
        };
    }
}
