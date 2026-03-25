import { BadRequestException, Injectable, Logger } from '@nestjs/common';

const API_BASE_URL = 'https://discord.com/api/v10';
const IMPORTABLE_CHANNEL_TYPES = new Set([0, 5, 11, 12]);

export interface DiscordGuildSnapshot {
    guild: { id: string; name: string };
    channels: DiscordChannel[];
    memberCount: number;
}

export interface DiscordChannel {
    id: string;
    name: string;
    topic: string | null;
    type: number;
    parent_id?: string | null;
}

export interface DiscordMessage {
    id: string;
    type: number;
    content: string;
    timestamp: string;
    edited_timestamp: string | null;
    pinned: boolean;
    author?: { id: string; username: string; global_name?: string | null };
    member?: { nick?: string | null };
    mentions?: Array<{ id: string }>;
    attachments?: Array<{ url: string; filename: string; size: number; content_type?: string | null }>;
    embeds?: Array<{
        title?: string;
        description?: string;
        url?: string;
        fields?: Array<{ name: string; value: string }>;
    }>;
    message_reference?: { message_id?: string };
}

@Injectable()
export class DiscordRestClient {
    private readonly logger = new Logger(DiscordRestClient.name);

    async getGuildSnapshot(botToken: string, guildId: string): Promise<DiscordGuildSnapshot> {
        const guild = await this.request<{ id: string; name: string }>(botToken, `/guilds/${guildId}`);
        const channels = await this.request<DiscordChannel[]>(botToken, `/guilds/${guildId}/channels`);
        const memberCount = await this.getMemberCount(botToken, guildId);
        return {
            guild,
            channels: channels.filter((channel) => IMPORTABLE_CHANNEL_TYPES.has(channel.type)),
            memberCount,
        };
    }

    async getAllChannelMessages(botToken: string, channelId: string): Promise<DiscordMessage[]> {
        const collected: DiscordMessage[] = [];
        let before: string | null = null;
        while (true) {
            const search = new URLSearchParams({ limit: '100' });
            if (before) search.set('before', before);
            const batch = await this.request<DiscordMessage[]>(
                botToken,
                `/channels/${channelId}/messages?${search.toString()}`,
            );
            if (batch.length === 0) break;
            collected.push(...batch);
            before = batch[batch.length - 1]?.id ?? null;
            if (batch.length < 100) break;
        }
        return collected.reverse();
    }

    private async getMemberCount(botToken: string, guildId: string): Promise<number> {
        let count = 0;
        let after = '0';
        try {
            while (true) {
                const batch = await this.request<Array<{ user?: { id: string } }>>(
                    botToken,
                    `/guilds/${guildId}/members?limit=1000&after=${after}`,
                );
                if (batch.length === 0) break;
                count += batch.length;
                after = batch[batch.length - 1]?.user?.id ?? after;
                if (batch.length < 1000) break;
            }
        } catch (error) {
            this.logger.warn(`Discord 멤버 수 조회 건너뜀: ${error instanceof Error ? error.message : String(error)}`);
        }
        return count;
    }

    private async request<T>(botToken: string, path: string, retryCount = 0): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: { Authorization: `Bot ${botToken}` },
        });
        if (response.status === 429 && retryCount < 2) {
            const payload = await response.json().catch(() => ({ retry_after: 1 }));
            const waitMs = Math.ceil((payload.retry_after ?? 1) * 1000);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            return this.request<T>(botToken, path, retryCount + 1);
        }
        if (!response.ok) {
            const message = await response.text();
            throw new BadRequestException(`Discord API 요청 실패 (${response.status}): ${message}`);
        }
        return response.json() as Promise<T>;
    }
}
