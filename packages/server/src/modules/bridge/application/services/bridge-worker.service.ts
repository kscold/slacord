import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BRIDGE_JOB_REPOSITORY, type IBridgeJobRepository } from '../../domain/bridge-job.port';
import { BridgeWebhookClient } from '../../infrastructure/external/bridge-webhook.client';
import { CLOCK, type Clock } from '../../../../shared/lib/clock';

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 3;

@Injectable()
export class BridgeWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BridgeWorkerService.name);
    private processing = false;
    private timer: NodeJS.Timeout | null = null;

    constructor(
        @Inject(BRIDGE_JOB_REPOSITORY) private readonly bridgeJobRepo: IBridgeJobRepository,
        private readonly bridgeWebhookClient: BridgeWebhookClient,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    onModuleInit() {
        if (process.env.NODE_ENV === 'test') return;
        this.timer = setInterval(() => {
            void this.processPending();
        }, POLL_INTERVAL_MS);
        this.timer.unref?.();
    }

    onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    async processPending(limit = 10) {
        if (this.processing) return 0;
        this.processing = true;
        let deliveredCount = 0;

        try {
            const jobs = await this.bridgeJobRepo.claimDueJobs(limit, this.clock.now());
            for (const job of jobs) {
                try {
                    await this.bridgeWebhookClient.deliver(job);
                    await this.bridgeJobRepo.markSent(job.id, this.clock.now());
                    deliveredCount += 1;
                } catch (error) {
                    const attemptCount = job.attemptCount + 1;
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    if (attemptCount >= MAX_ATTEMPTS) {
                        await this.bridgeJobRepo.markFailed(job.id, errorMessage, attemptCount);
                        this.logger.warn(`Bridge relay permanently failed: ${job.platform} ${job.eventType} jobId=${job.id}`);
                    } else {
                        const availableAt = new Date(this.clock.now().getTime() + attemptCount * 2000);
                        await this.bridgeJobRepo.markRetry(job.id, errorMessage, attemptCount, availableAt);
                        this.logger.warn(`Bridge relay retry scheduled: ${job.platform} ${job.eventType} jobId=${job.id}`);
                    }
                }
            }

            return deliveredCount;
        } finally {
            this.processing = false;
        }
    }
}
