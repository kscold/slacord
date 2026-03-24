import { Module } from '@nestjs/common';
import { GithubWebhookController } from './infrastructure/http/github-webhook.controller';
import { GithubConfigService } from './infrastructure/service/github-config.service';
import { ProcessGitHubEventUseCase } from './application/use-cases/process-github-event.use-case';
import { MessageModule } from '../message/message.module';
import { TeamModule } from '../team/team.module';

@Module({
    imports: [MessageModule, TeamModule],
    controllers: [GithubWebhookController],
    providers: [GithubConfigService, ProcessGitHubEventUseCase],
    exports: [GithubConfigService],
})
export class GithubModule {}
