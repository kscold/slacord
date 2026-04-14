import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamModule } from '../team/team.module';
import { BridgeJob, BridgeJobSchema } from './infrastructure/persistence/bridge-job.schema';
import { BridgeJobRepository } from './infrastructure/persistence/bridge-job.repository';
import { BRIDGE_JOB_REPOSITORY } from './domain/bridge-job.port';
import { BridgeWebhookClient } from './infrastructure/external/bridge-webhook.client';
import { BridgeEnqueueService } from './application/services/bridge-enqueue.service';
import { BridgeWorkerService } from './application/services/bridge-worker.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: BridgeJob.name, schema: BridgeJobSchema }]), TeamModule],
    providers: [
        { provide: BRIDGE_JOB_REPOSITORY, useClass: BridgeJobRepository },
        BridgeWebhookClient,
        BridgeEnqueueService,
        BridgeWorkerService,
    ],
    exports: [BridgeEnqueueService, BridgeWorkerService],
})
export class BridgeModule {}
