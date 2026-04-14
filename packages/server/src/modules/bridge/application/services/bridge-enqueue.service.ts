import { Inject, Injectable } from '@nestjs/common';
import { type AnnouncementEntity } from '../../../announcement/domain/announcement.entity';
import { type GitHubEventEntity } from '../../../github/domain/github-event.entity';
import { BRIDGE_JOB_REPOSITORY, type IBridgeJobRepository } from '../../domain/bridge-job.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import type { BridgeEventType, BridgePlatform, CreateBridgeJobInput } from '../../domain/bridge-job.entity';
import type { BridgeWorkerConfig, BridgeWorkerTargetConfig } from '../../../team/domain/team.entity';

@Injectable()
export class BridgeEnqueueService {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(BRIDGE_JOB_REPOSITORY) private readonly bridgeJobRepo: IBridgeJobRepository,
    ) {}

    async enqueueAnnouncement(announcement: AnnouncementEntity) {
        return this.enqueueJobs(announcement.teamId, {
            eventType: 'announcement',
            title: announcement.title,
            content: announcement.content,
            url: null,
        });
    }

    async enqueueGithubEvent(teamId: string, event: GitHubEventEntity) {
        return this.enqueueJobs(teamId, {
            eventType: 'github',
            title: event.toCardContent(),
            content: [event.repoName, event.actor].filter(Boolean).join(' · '),
            url: event.url || null,
        });
    }

    private async enqueueJobs(
        teamId: string,
        payload: { eventType: BridgeEventType; title: string; content: string; url: string | null },
    ) {
        const team = await this.teamRepo.findById(teamId);
        if (!team) return 0;

        const jobs = buildBridgeJobs(teamId, team.bridgeConfig, payload);
        if (jobs.length === 0) return 0;

        await this.bridgeJobRepo.enqueueMany(jobs);
        return jobs.length;
    }
}

function buildBridgeJobs(
    teamId: string,
    config: BridgeWorkerConfig,
    payload: { eventType: BridgeEventType; title: string; content: string; url: string | null },
): CreateBridgeJobInput[] {
    return ([
        ['slack', config.slack],
        ['discord', config.discord],
    ] as const)
        .filter(([, target]) => shouldRelay(target, payload.eventType))
        .map(([platform, target]) => ({
            teamId,
            platform,
            eventType: payload.eventType,
            webhookUrl: target.webhookUrl.trim(),
            title: payload.title,
            content: payload.content,
            url: payload.url,
        }));
}

function shouldRelay(target: BridgeWorkerTargetConfig, eventType: BridgeEventType) {
    if (!target.enabled) return false;
    if (!target.webhookUrl.trim()) return false;
    return eventType === 'announcement' ? target.relayAnnouncements : target.relayGithub;
}
