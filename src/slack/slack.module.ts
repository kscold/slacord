import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';

@Module({
    providers: [SlackService],
    controllers: [SlackController],
    exports: [SlackService],
})
export class SlackModule {}
