import { Inject, Injectable } from '@nestjs/common';
import { CHANNEL_REPOSITORY, type IChannelRepository } from '../../../channel/domain/channel.port';
import type { ChannelEntity } from '../../../channel/domain/channel.entity';
import { MESSAGE_REPOSITORY, type IMessageRepository } from '../../domain/message.port';
import type { MessageEntity } from '../../domain/message.entity';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';

interface GetMessageSearchInput {
    userId: string;
    limit?: number;
    pinnedLimit?: number;
    query?: string;
    recentLimit?: number;
}

interface SearchChannelScope {
    channelId: string;
    channelName: string;
    teamId: string;
    teamName: string;
}

export interface MessageSearchResultItem {
    id: string;
    teamId: string;
    teamName: string;
    channelId: string;
    channelName: string;
    authorName: string;
    content: string;
    createdAt: string;
    type: MessageEntity['type'];
    isPinned: boolean;
    attachmentCount: number;
}

export interface MessageSearchResponse {
    pinnedResults: MessageSearchResultItem[];
    recentResults: MessageSearchResultItem[];
    results: MessageSearchResultItem[];
    teamCount: number;
}

@Injectable()
export class GetMessageSearchUseCase {
    constructor(
        @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
    ) {}

    async execute(input: GetMessageSearchInput): Promise<MessageSearchResponse> {
        const limit = Math.min(Math.max(input.limit ?? 30, 1), 50);
        const recentLimit = Math.min(Math.max(input.recentLimit ?? 8, 1), 20);
        const pinnedLimit = Math.min(Math.max(input.pinnedLimit ?? 6, 1), 20);
        const query = input.query?.trim() ?? '';
        const scope = await this.buildScope(input.userId);

        if (!scope.channels.length) {
            return {
                pinnedResults: [],
                recentResults: [],
                results: [],
                teamCount: scope.teamCount,
            };
        }

        const scopeByChannelId = new Map(scope.channels.map((channel) => [channel.channelId, channel]));

        if (query.length >= 2) {
            const results = await this.searchResults(scope.channels, scopeByChannelId, query, limit);
            return {
                pinnedResults: [],
                recentResults: [],
                results,
                teamCount: scope.teamCount,
            };
        }

        const [recentMessages, pinnedMessages] = await Promise.all([
            this.messageRepo.findRecentByChannels(scope.channelIds, recentLimit),
            this.messageRepo.findPinnedByChannels(scope.channelIds, pinnedLimit),
        ]);

        return {
            pinnedResults: this.toSearchItems(pinnedMessages, scopeByChannelId).slice(0, pinnedLimit),
            recentResults: this.toSearchItems(recentMessages, scopeByChannelId).slice(0, recentLimit),
            results: [],
            teamCount: scope.teamCount,
        };
    }

    private async searchResults(
        channels: SearchChannelScope[],
        scopeByChannelId: Map<string, SearchChannelScope>,
        rawQuery: string,
        limit: number,
    ) {
        const query = rawQuery.toLowerCase();
        const matchedChannels = channels.filter((channel) =>
            [channel.teamName, channel.channelName].some((value) => value.toLowerCase().includes(query)),
        );

        const [primaryMatches, metadataMatches] = await Promise.all([
            this.messageRepo.searchByChannels(
                channels.map((channel) => channel.channelId),
                rawQuery,
                Math.max(limit * 3, 45),
            ),
            matchedChannels.length
                ? this.messageRepo.findRecentByChannels(
                      matchedChannels.map((channel) => channel.channelId),
                      Math.max(limit, 18),
                  )
                : Promise.resolve([]),
        ]);

        const mergedMessages = [...primaryMatches, ...metadataMatches].sort(
            (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        );
        const deduped = Array.from(new Map(mergedMessages.map((message) => [message.id, message])).values());

        return this.toSearchItems(deduped, scopeByChannelId)
            .filter((item) =>
                [item.content, item.authorName, item.teamName, item.channelName].some((value) =>
                    value.toLowerCase().includes(query),
                ),
            )
            .slice(0, limit);
    }

    private async buildScope(userId: string) {
        const teams = await this.teamRepo.findByMember(userId);
        const channelsByTeam = await Promise.all(
            teams.map(async (team) => ({
                channels: await this.channelRepo.findByTeam(team.id),
                team,
            })),
        );

        const channels = channelsByTeam.flatMap(({ channels, team }) =>
            channels
                .filter((channel) => this.isVisibleChannel(channel, userId))
                .filter((channel) => channel.type !== 'dm' && channel.type !== 'group')
                .map((channel) => ({
                    channelId: channel.id,
                    channelName: channel.name,
                    teamId: team.id,
                    teamName: team.name,
                })),
        );

        return {
            channelIds: channels.map((channel) => channel.channelId),
            channels,
            teamCount: teams.length,
        };
    }

    private isVisibleChannel(channel: ChannelEntity, userId: string) {
        return channel.type === 'public' || channel.type === 'voice' || channel.isMember(userId);
    }

    private toSearchItems(messages: MessageEntity[], scopeByChannelId: Map<string, SearchChannelScope>) {
        return messages
            .map((message) => {
                const scope = scopeByChannelId.get(message.channelId);
                if (!scope) return null;

                return {
                    id: message.id,
                    teamId: scope.teamId,
                    teamName: scope.teamName,
                    channelId: scope.channelId,
                    channelName: scope.channelName,
                    authorName: message.authorName || '알 수 없음',
                    content: normalizeMessageContent(message),
                    createdAt: message.createdAt.toISOString(),
                    type: message.type,
                    isPinned: message.isPinned,
                    attachmentCount: message.attachments.length,
                } satisfies MessageSearchResultItem;
            })
            .filter((item): item is MessageSearchResultItem => item !== null);
    }
}

function normalizeMessageContent(message: MessageEntity) {
    const stripped = message.content.replace(/<!--github:.+?-->/, '').trim();
    if (stripped) return stripped;
    if (message.attachments.length) return message.attachments.map((item) => item.name).join(', ');
    return message.type === 'system' ? '시스템 메시지' : '내용 없음';
}
