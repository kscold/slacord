import { Global, Module } from '@nestjs/common';
import { DiscordNotifyService } from './discord-notify.service';
import { DiscordRestClient } from './infrastructure/external/discord-rest.client';
import { ImportDiscordGuildUseCase } from './application/use-cases/import-discord-guild.use-case';
import { DiscordImportController } from './infrastructure/http/discord-import.controller';
import { TeamModule } from '../team/team.module';
import { ChannelModule } from '../channel/channel.module';
import { MessageModule } from '../message/message.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [AuthModule, TeamModule, ChannelModule, MessageModule],
    controllers: [DiscordImportController],
    providers: [DiscordNotifyService, DiscordRestClient, ImportDiscordGuildUseCase],
    exports: [DiscordNotifyService],
})
export class DiscordModule {}
