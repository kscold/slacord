import { Module } from '@nestjs/common';
import { PresenceService } from './infrastructure/service/presence.service';
import { PresenceGateway } from './infrastructure/websocket/presence.gateway';
import { PresenceController } from './infrastructure/http/presence.controller';

@Module({
    controllers: [PresenceController],
    providers: [PresenceService, PresenceGateway],
    exports: [PresenceService],
})
export class PresenceModule {}
