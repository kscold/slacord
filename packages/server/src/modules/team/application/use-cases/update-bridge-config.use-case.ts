import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import {
    createTeamAuditLogEntry,
    createDefaultBridgeWorkerConfig,
    type BridgeWorkerConfig,
    type BridgeWorkerTargetConfig,
    type TeamEntity,
} from '../../domain/team.entity';

@Injectable()
export class UpdateBridgeConfigUseCase {
    constructor(@Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository) {}

    async execute(teamId: string, actorId: string, config: BridgeWorkerConfig): Promise<TeamEntity> {
        const team = await this.teamRepo.findById(teamId);
        if (!team) throw new BadRequestException('존재하지 않는 팀입니다.');
        if (!team.hasAdminAccess(actorId)) throw new BadRequestException('외부 브리지 설정을 변경할 권한이 없습니다.');

        const normalized = normalizeBridgeConfig(config);
        const enabledTargets = ['slack', 'discord'].filter((platform) => normalized[platform as keyof BridgeWorkerConfig].enabled);
        const result = await this.teamRepo.updateBridgeConfig(teamId, normalized, createTeamAuditLogEntry({
            actorId,
            category: 'delivery',
            action: 'bridge_config_updated',
            summary: 'Slack/Discord 브리지 설정을 저장함',
            target: enabledTargets.length > 0 ? enabledTargets.join(', ') : 'disabled',
            metadata: {
                slackEnabled: normalized.slack.enabled,
                slackRelayAnnouncements: normalized.slack.relayAnnouncements,
                slackRelayGithub: normalized.slack.relayGithub,
                discordEnabled: normalized.discord.enabled,
                discordRelayAnnouncements: normalized.discord.relayAnnouncements,
                discordRelayGithub: normalized.discord.relayGithub,
            },
        }));
        if (!result) throw new BadRequestException('외부 브리지 설정 저장에 실패했습니다.');
        return result;
    }
}

function normalizeBridgeConfig(config: BridgeWorkerConfig): BridgeWorkerConfig {
    return {
        slack: normalizeTargetConfig('Slack', config?.slack),
        discord: normalizeTargetConfig('Discord', config?.discord),
    };
}

function normalizeTargetConfig(label: string, target?: BridgeWorkerTargetConfig | null): BridgeWorkerTargetConfig {
    const defaults = createDefaultBridgeWorkerConfig();
    const merged = { ...defaults.slack, ...(target ?? {}) };
    const webhookUrl = (merged.webhookUrl ?? '').trim();
    const shouldValidateWebhook = merged.enabled || merged.relayAnnouncements || merged.relayGithub || webhookUrl.length > 0;

    if (shouldValidateWebhook) {
        assertWebhookUrl(label, webhookUrl);
    }

    return {
        enabled: Boolean(merged.enabled),
        webhookUrl,
        relayAnnouncements: Boolean(merged.relayAnnouncements),
        relayGithub: Boolean(merged.relayGithub),
    };
}

function assertWebhookUrl(label: string, webhookUrl: string) {
    if (!webhookUrl) {
        throw new BadRequestException(`${label} webhook URL을 입력해 주세요.`);
    }

    try {
        const parsed = new URL(webhookUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('unsupported protocol');
        }
    } catch {
        throw new BadRequestException(`${label} webhook URL 형식이 올바르지 않습니다.`);
    }
}
