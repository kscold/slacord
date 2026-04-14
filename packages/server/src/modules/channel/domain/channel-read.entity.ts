export class ChannelReadEntity {
    constructor(
        public readonly id: string,
        public readonly teamId: string,
        public readonly channelId: string,
        public readonly userId: string,
        public readonly lastReadAt: Date,
        public readonly updatedAt: Date,
    ) {}
}
