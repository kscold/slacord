export type PresenceStatus = 'online' | 'away' | 'offline';

/** 팀원 온라인 상태 도메인 엔티티 */
export class PresenceEntity {
    constructor(
        public readonly userId: string,
        public readonly status: PresenceStatus,
        public readonly lastSeen: Date,
    ) {}

    toPublic() {
        return {
            userId: this.userId,
            status: this.status,
            lastSeen: this.lastSeen,
        };
    }
}
