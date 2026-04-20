import { Module } from '@nestjs/common';
import { GithubWebhookController } from './infrastructure/http/github-webhook.controller';
import { GithubConfigService } from './infrastructure/service/github-config.service';
import { ProcessGitHubEventUseCase } from './application/use-cases/process-github-event.use-case';
import { BridgeModule } from '../bridge/bridge.module';
import { MessageModule } from '../message/message.module';
import { TeamModule } from '../team/team.module';

@Module({
    // MessageModule: ProcessGitHubEventUseCase가 MESSAGE_REPOSITORY 의존. 게이트웨이 직접 호출은 제거됨.
    imports: [MessageModule, TeamModule, BridgeModule],
    controllers: [GithubWebhookController],
    providers: [GithubConfigService, ProcessGitHubEventUseCase],
    exports: [GithubConfigService],
})
export class GithubModule {}
