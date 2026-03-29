import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PresenceService } from './infrastructure/service/presence.service';
import { PresenceGateway } from './infrastructure/websocket/presence.gateway';
import { PresenceController } from './infrastructure/http/presence.controller';

@Module({
    imports: [AuthModule],
    controllers: [PresenceController],
    providers: [PresenceService, PresenceGateway],
    exports: [PresenceService],
})
export class PresenceModule {}
