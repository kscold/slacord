import type { BridgeJobEntity, CreateBridgeJobInput } from './bridge-job.entity';

export interface IBridgeJobRepository {
    enqueueMany(inputs: CreateBridgeJobInput[]): Promise<BridgeJobEntity[]>;
    claimDueJobs(limit: number, now?: Date): Promise<BridgeJobEntity[]>;
    listRecent(teamId: string, limit: number): Promise<BridgeJobEntity[]>;
    markSent(id: string, deliveredAt?: Date): Promise<void>;
    markRetry(id: string, errorMessage: string, attemptCount: number, availableAt: Date): Promise<void>;
    markFailed(id: string, errorMessage: string, attemptCount: number): Promise<void>;
}

export const BRIDGE_JOB_REPOSITORY = Symbol('IBridgeJobRepository');
