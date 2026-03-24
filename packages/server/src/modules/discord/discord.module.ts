import { Global, Module } from '@nestjs/common';
import { DiscordNotifyService } from './discord-notify.service';

@Global()
@Module({
    providers: [DiscordNotifyService],
    exports: [DiscordNotifyService],
})
export class DiscordModule {}
