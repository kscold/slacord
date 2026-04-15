import type { BridgeJobEntity, CreateBridgeJobInput } from './bridge-job.entity';

export interface BridgeJobListOptions {
    limit: number;
    status?: 'pending' | 'processing' | 'sent' | 'failed';
    platform?: 'slack' | 'discord';
    eventType?: 'announcement' | 'github';
}

export interface IBridgeJobRepository {
    enqueueMany(inputs: CreateBridgeJobInput[]): Promise<BridgeJobEntity[]>;
    claimDueJobs(limit: number, now?: Date): Promise<BridgeJobEntity[]>;
    findById(id: string): Promise<BridgeJobEntity | null>;
    listRecent(teamId: string, options: BridgeJobListOptions): Promise<BridgeJobEntity[]>;
    markSent(id: string, deliveredAt?: Date): Promise<void>;
    markRetry(id: string, errorMessage: string, attemptCount: number, availableAt: Date): Promise<void>;
    markFailed(id: string, errorMessage: string, attemptCount: number): Promise<void>;
}

export const BRIDGE_JOB_REPOSITORY = Symbol('IBridgeJobRepository');
