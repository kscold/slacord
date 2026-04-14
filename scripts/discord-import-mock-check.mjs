import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const apiBaseUrl = (process.env.SLACORD_DISCORD_MOCK_API_URL || 'http://127.0.0.1:18084/api').replace(/\/+$/, '');
const reportPath = path.resolve(process.env.SLACORD_DISCORD_MOCK_REPORT || './artifacts/live-surface-check/discord-import-mock-report.json');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function api(pathName, options = {}) {
    const response = await fetch(`${apiBaseUrl}${pathName}`, {
        method: options.method || 'GET',
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (options.expectOk !== false && !response.ok) {
        throw new Error(`HTTP ${response.status} ${pathName}: ${JSON.stringify(payload)}`);
    }
    return { status: response.status, payload };
}

async function main() {
    const stamp = Date.now();
    const email = `discord_mock_${stamp}@example.com`;
    const password = 'test1234';
    const username = `discordmock${String(stamp).slice(-6)}`;

    await api('/auth/register', {
        method: 'POST',
        body: { email, password, username },
    });
    const login = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
    });
    const token = login.payload?.data?.accessToken;
    assert(token, '로그인 토큰이 없습니다.');

    const team = await api('/team', {
        method: 'POST',
        token,
        body: {
            name: 'Discord Mock Check',
            slug: `discord-mock-check-${stamp}`,
        },
    });
    const teamId = team.payload?.data?.id;
    assert(teamId, 'teamId가 없습니다.');

    const body = {
        guildId: 'mock-guild',
        botToken: 'mock-token-1234567890-long',
        channelIds: [],
    };

    const firstImport = await api(`/team/${teamId}/discord/import`, {
        method: 'POST',
        token,
        body,
    });

    const channelsAfterFirst = await api(`/team/${teamId}/channel`, { token });
    const general = (channelsAfterFirst.payload?.data || []).find((channel) => channel.name === 'general');
    assert(general?.id, '첫 import 후 general 채널이 없습니다.');

    const messagesAfterFirst = await api(`/channel/${general.id}/message`, { token });
    assert((channelsAfterFirst.payload?.data || []).every((channel) => channel.externalSource === 'discord' && channel.externalId), '첫 import 채널 외부 참조가 저장되지 않았습니다.');
    assert((messagesAfterFirst.payload?.data || []).every((message) => message.externalSource === 'discord' && message.externalId), '첫 import 메시지 외부 참조가 저장되지 않았습니다.');

    const secondImport = await api(`/team/${teamId}/discord/import`, {
        method: 'POST',
        token,
        body,
    });

    const channelsAfterSecond = await api(`/team/${teamId}/channel`, { token });
    const messagesAfterSecond = await api(`/channel/${general.id}/message`, { token });
    assert(channelsAfterSecond.payload?.data?.length === channelsAfterFirst.payload?.data?.length, '재import 후 채널 수가 증가했습니다.');
    const namesAfterSecond = (channelsAfterSecond.payload?.data || []).map((channel) => channel.name);
    const uniqueNames = new Set(namesAfterSecond);
    assert(uniqueNames.size === namesAfterSecond.length, '재import 후 중복 채널 이름이 생겼습니다.');
    const firstMessageByExternalId = new Map((messagesAfterFirst.payload?.data || []).map((message) => [message.externalId, message]));
    const replyAfterFirst = firstMessageByExternalId.get('mock-message-2');
    const parentAfterFirst = firstMessageByExternalId.get('mock-message-1');
    assert(replyAfterFirst?.replyToId === parentAfterFirst?.id, '첫 import에서 Discord 답글 참조가 복원되지 않았습니다.');

    const summary = {
        generatedAt: new Date().toISOString(),
        apiBaseUrl,
        teamId,
        firstImport: firstImport.payload?.data,
        secondImport: secondImport.payload?.data,
        channelsAfterFirst: (channelsAfterFirst.payload?.data || []).map((channel) => ({
            id: channel.id,
            name: channel.name,
            externalSource: channel.externalSource ?? null,
            externalId: channel.externalId ?? null,
        })),
        messagesAfterFirst: (messagesAfterFirst.payload?.data || []).map((message) => ({
            id: message.id,
            content: message.content,
            externalSource: message.externalSource ?? null,
            externalId: message.externalId ?? null,
            replyToId: message.replyToId ?? null,
            isPinned: message.isPinned ?? false,
        })),
        messagesAfterSecond: (messagesAfterSecond.payload?.data || []).map((message) => ({
            id: message.id,
            content: message.content,
            externalSource: message.externalSource ?? null,
            externalId: message.externalId ?? null,
            replyToId: message.replyToId ?? null,
            isPinned: message.isPinned ?? false,
        })),
        channelsAfterSecond: (channelsAfterSecond.payload?.data || []).map((channel) => ({
            id: channel.id,
            name: channel.name,
            externalSource: channel.externalSource ?? null,
            externalId: channel.externalId ?? null,
        })),
    };

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));

    console.log(`report: ${reportPath}`);
    console.log(JSON.stringify(summary, null, 2));
}

await main();
