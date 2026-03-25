import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CHANNEL_REPOSITORY, type IChannelRepository } from '../../../channel/domain/channel.port';
import { MESSAGE_REPOSITORY, type IMessageRepository } from '../../../message/domain/message.port';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../../team/domain/team.port';
import type { MessageType } from '../../../message/domain/message.entity';
import { DiscordRestClient, type DiscordChannel, type DiscordMessage } from '../../infrastructure/external/discord-rest.client';

interface ImportDiscordGuildInput {
    teamId: string;
    requestedBy: string;
    botToken: string;
    guildId: string;
    channelIds?: string[];
}

@Injectable()
export class ImportDiscordGuildUseCase {
    constructor(
        private readonly discordClient: DiscordRestClient,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CHANNEL_REPOSITORY) private readonly channelRepo: IChannelRepository,
        @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
    ) {}

    async execute(input: ImportDiscordGuildInput) {
        const team = await this.teamRepo.findById(input.teamId);
        const role = team?.getMember(input.requestedBy)?.role ?? null;
        if (!team || !role) throw new BadRequestException('접근할 수 없는 워크스페이스입니다.');
        if (role !== 'owner' && role !== 'admin') {
            throw new BadRequestException('Discord 가져오기는 관리자만 실행할 수 있습니다.');
        }

        const snapshot = await this.discordClient.getGuildSnapshot(input.botToken, input.guildId);
        const selectedIds = new Set((input.channelIds ?? []).filter(Boolean));
        const targetChannels = snapshot.channels.filter((channel) => selectedIds.size === 0 || selectedIds.has(channel.id));
        const occupiedNames = new Set((await this.channelRepo.findByTeam(input.teamId)).map((channel) => channel.name.toLowerCase()));
        let importedChannels = 0;
        let importedMessages = 0;
        let updatedMessages = 0;

        for (const remoteChannel of targetChannels) {
            const localChannel = await this.upsertChannel(input, remoteChannel, occupiedNames);
            importedChannels += 1;
            const localMessageIds = new Map<string, string>();
            const messages = await this.discordClient.getAllChannelMessages(input.botToken, remoteChannel.id);
            for (const remoteMessage of messages) {
                const existed = await this.messageRepo.findByExternalRef(localChannel.id, 'discord', remoteMessage.id);
                const saved = await this.messageRepo.saveImported({
                    teamId: input.teamId,
                    channelId: localChannel.id,
                    authorId: toImportedAuthorId(remoteMessage.author?.id),
                    authorName: getAuthorName(remoteMessage),
                    content: buildImportedContent(remoteMessage),
                    type: resolveMessageType(remoteMessage),
                    attachments: (remoteMessage.attachments ?? []).map((attachment) => ({
                        url: attachment.url,
                        name: attachment.filename,
                        size: attachment.size,
                        mimeType: attachment.content_type ?? 'application/octet-stream',
                    })),
                    replyToId: await this.resolveReplyId(localChannel.id, localMessageIds, remoteMessage),
                    mentions: (remoteMessage.mentions ?? []).map((user) => toImportedAuthorId(user.id)),
                    externalSource: 'discord',
                    externalId: remoteMessage.id,
                    createdAt: new Date(remoteMessage.timestamp),
                    updatedAt: new Date(remoteMessage.edited_timestamp ?? remoteMessage.timestamp),
                    isPinned: Boolean(remoteMessage.pinned),
                    pinnedAt: remoteMessage.pinned ? new Date(remoteMessage.timestamp) : null,
                });
                localMessageIds.set(remoteMessage.id, saved.id);
                if (existed) updatedMessages += 1;
                else importedMessages += 1;
            }
        }

        return {
            guildId: snapshot.guild.id,
            guildName: snapshot.guild.name,
            memberCount: snapshot.memberCount,
            importedChannels,
            importedMessages,
            updatedMessages,
            channelCount: targetChannels.length,
        };
    }

    private async upsertChannel(
        input: ImportDiscordGuildInput,
        remoteChannel: DiscordChannel,
        occupiedNames: Set<string>,
    ) {
        const existing = await this.channelRepo.findByExternalRef(input.teamId, 'discord', remoteChannel.id);
        const name = existing?.name ?? createUniqueChannelName(remoteChannel.name || `discord-${remoteChannel.id.slice(-6)}`, occupiedNames);
        occupiedNames.add(name.toLowerCase());
        return this.channelRepo.saveImported({
            teamId: input.teamId,
            name,
            description: remoteChannel.topic ?? null,
            type: 'public' as const,
            createdBy: input.requestedBy,
            memberIds: [],
            externalSource: 'discord',
            externalId: remoteChannel.id,
        });
    }

    private async resolveReplyId(channelId: string, localMessageIds: Map<string, string>, remoteMessage: DiscordMessage) {
        const externalParentId = remoteMessage.message_reference?.message_id;
        if (!externalParentId) return null;
        const mapped = localMessageIds.get(externalParentId);
        if (mapped) return mapped;
        const existing = await this.messageRepo.findByExternalRef(channelId, 'discord', externalParentId);
        return existing?.id ?? null;
    }
}

function toImportedAuthorId(authorId?: string) {
    return authorId ? `discord:${authorId}` : 'discord:system';
}

function getAuthorName(message: DiscordMessage) {
    return message.member?.nick ?? message.author?.global_name ?? message.author?.username ?? 'Discord 사용자';
}

function resolveMessageType(message: DiscordMessage): MessageType {
    if (message.type !== 0) return 'system';
    if ((message.attachments ?? []).length > 0 && !message.content.trim()) return 'file';
    return 'text';
}

function buildImportedContent(message: DiscordMessage) {
    const chunks = [message.content.trim()].filter(Boolean);
    for (const embed of message.embeds ?? []) {
        if (embed.title) chunks.push(embed.title);
        if (embed.description) chunks.push(embed.description);
        if (embed.url) chunks.push(embed.url);
        for (const field of embed.fields ?? []) {
            chunks.push(`${field.name}\n${field.value}`);
        }
    }
    if (chunks.length === 0 && (message.attachments ?? []).length > 0) {
        chunks.push((message.attachments ?? []).map((attachment) => attachment.filename).join('\n'));
    }
    return chunks.join('\n\n');
}

function createUniqueChannelName(baseName: string, occupiedNames: Set<string>) {
    const normalized = baseName.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'discord-import';
    let next = normalized;
    let suffix = 2;
    while (occupiedNames.has(next.toLowerCase())) {
        next = `${normalized}-${suffix}`;
        suffix += 1;
    }
    return next;
}
