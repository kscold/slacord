import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
import { PresenceAccessService } from './application/services/presence-access.service';
import { PresenceService } from './infrastructure/service/presence.service';
import { PresenceGateway } from './infrastructure/websocket/presence.gateway';
import { PresenceController } from './infrastructure/http/presence.controller';

@Module({
    imports: [AuthModule, TeamModule],
    controllers: [PresenceController],
    providers: [PresenceService, PresenceAccessService, PresenceGateway],
    exports: [PresenceService],
})
export class PresenceModule {}
