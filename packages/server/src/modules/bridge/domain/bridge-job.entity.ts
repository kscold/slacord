export type BridgePlatform = 'slack' | 'discord';
export type BridgeEventType = 'announcement' | 'github';
export type BridgeJobStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface CreateBridgeJobInput {
    teamId: string;
    platform: BridgePlatform;
    eventType: BridgeEventType;
    webhookUrl: string;
    title: string;
    content: string;
    url: string | null;
}

export class BridgeJobEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly platform: BridgePlatform,
        public readonly eventType: BridgeEventType,
        public readonly webhookUrl: string,
        public readonly title: string,
        public readonly content: string,
        public readonly url: string | null,
        public readonly status: BridgeJobStatus,
        public readonly attemptCount: number,
        public readonly availableAt: Date,
        public readonly claimedAt: Date | null,
        public readonly deliveredAt: Date | null,
        public readonly lastError: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    toPublic() {
        return {
            id: this.id,
            teamId: this.teamId,
            platform: this.platform,
            eventType: this.eventType,
            title: this.title,
            content: this.content,
            url: this.url,
            status: this.status,
            attemptCount: this.attemptCount,
            availableAt: this.availableAt,
            claimedAt: this.claimedAt,
            deliveredAt: this.deliveredAt,
            lastError: this.lastError,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
