import { Module } from '@nestjs/common';

import { SlackController } from './slack.controller';

import { SlackService } from './slack.service';

@Module({
    providers: [SlackService],
    controllers: [SlackController],
    exports: [SlackService],
})
export class SlackModule {}
