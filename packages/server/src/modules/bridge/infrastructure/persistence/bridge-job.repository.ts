import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { type IBridgeJobRepository } from '../../domain/bridge-job.port';
import { BridgeJob, type BridgeJobDocument } from './bridge-job.schema';
import { BridgeJobEntity, type CreateBridgeJobInput } from '../../domain/bridge-job.entity';

const CLAIM_STALE_MS = 60_000;

@Injectable()
export class BridgeJobRepository implements IBridgeJobRepository {
    constructor(@InjectModel(BridgeJob.name) private readonly bridgeJobModel: Model<BridgeJobDocument>) {}

    async enqueueMany(inputs: CreateBridgeJobInput[]) {
        if (inputs.length === 0) return [];
        const docs = await this.bridgeJobModel.insertMany(
            inputs.map((input) => ({
                ...input,
                status: 'pending',
                attemptCount: 0,
                availableAt: new Date(),
                claimedAt: null,
                deliveredAt: null,
                lastError: null,
            })),
        );
        return docs.map((doc) => this.toEntity(doc.toObject()));
    }

    async claimDueJobs(limit: number, now = new Date()) {
        const claimed: BridgeJobEntity[] = [];
        const staleBefore = new Date(now.getTime() - CLAIM_STALE_MS);

        for (let index = 0; index < limit; index += 1) {
            const doc = await this.bridgeJobModel.findOneAndUpdate(
                {
                    $or: [
                        { status: 'pending', availableAt: { $lte: now } },
                        { status: 'processing', claimedAt: { $lte: staleBefore } },
                    ],
                },
                {
                    $set: {
                        status: 'processing',
                        claimedAt: now,
                        lastError: null,
                    },
                },
                {
                    new: true,
                    sort: { availableAt: 1, createdAt: 1 },
                },
            ).lean();

            if (!doc) break;
            claimed.push(this.toEntity(doc));
        }

        return claimed;
    }

    async findById(id: string) {
        const doc = await this.bridgeJobModel.findById(id).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async listRecent(teamId: string, limit: number) {
        const docs = await this.bridgeJobModel
            .find({ teamId })
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(limit)
            .lean();
        return docs.map((doc) => this.toEntity(doc));
    }

    async markSent(id: string, deliveredAt = new Date()) {
        await this.bridgeJobModel.findByIdAndUpdate(id, {
            $set: {
                status: 'sent',
                deliveredAt,
                lastError: null,
            },
        });
    }

    async markRetry(id: string, errorMessage: string, attemptCount: number, availableAt: Date) {
        await this.bridgeJobModel.findByIdAndUpdate(id, {
            $set: {
                status: 'pending',
                lastError: errorMessage,
                attemptCount,
                availableAt,
            },
        });
    }

    async markFailed(id: string, errorMessage: string, attemptCount: number) {
        await this.bridgeJobModel.findByIdAndUpdate(id, {
            $set: {
                status: 'failed',
                lastError: errorMessage,
                attemptCount,
            },
        });
    }

    private toEntity(doc: any) {
        return new BridgeJobEntity(
            doc._id.toString(),
            doc.teamId,
            doc.platform,
            doc.eventType,
            doc.webhookUrl,
            doc.title,
            doc.content,
            doc.url ?? null,
            doc.status,
            doc.attemptCount ?? 0,
            doc.availableAt,
            doc.claimedAt ?? null,
            doc.deliveredAt ?? null,
            doc.lastError ?? null,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
