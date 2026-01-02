import { Module } from '@nestjs/common';
import { RelayService } from './relay.service';
import { SlackModule } from '../slack/slack.module';
import { DiscordModule } from '../discord/discord.module';

/**
 * Relay 모듈
 * - Slack과 Discord 간 메시지 중계
 * - Slack 메시지를 Discord로 자동 백업
 */
@Module({
  imports: [SlackModule, DiscordModule],
  providers: [RelayService],
  exports: [RelayService],
})
export class RelayModule {}
