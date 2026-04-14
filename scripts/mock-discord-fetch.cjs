const realFetch = global.fetch;

const guildId = 'mock-guild';
const channelId = 'mock-channel-1';
const messages = [
    {
        id: 'mock-message-2',
        type: 0,
        content: 'Follow-up reply',
        timestamp: '2026-04-14T00:01:00.000Z',
        edited_timestamp: null,
        pinned: true,
        author: { id: 'discord-user-2', username: 'mock-bot' },
        member: { nick: 'Mock Bot' },
        mentions: [{ id: 'discord-user-1' }],
        attachments: [
            {
                url: 'https://cdn.example.com/file.txt',
                filename: 'file.txt',
                size: 42,
                content_type: 'text/plain',
            },
        ],
        embeds: [],
        message_reference: { message_id: 'mock-message-1' },
    },
    {
        id: 'mock-message-1',
        type: 0,
        content: 'Hello from mocked Discord',
        timestamp: '2026-04-14T00:00:00.000Z',
        edited_timestamp: null,
        pinned: false,
        author: { id: 'discord-user-1', username: 'mock-user' },
        member: { nick: 'Mock User' },
        mentions: [],
        attachments: [],
        embeds: [],
    },
];

global.fetch = async function patchedFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url;

    if (typeof url === 'string' && url.startsWith('https://discord.com/api/v10')) {
        const parsed = new URL(url);

        if (parsed.pathname === `/api/v10/guilds/${guildId}`) {
            return jsonResponse({ id: guildId, name: 'Mock Discord Guild' });
        }

        if (parsed.pathname === `/api/v10/guilds/${guildId}/channels`) {
            return jsonResponse([
                { id: channelId, name: 'general', topic: 'mocked topic', type: 0 },
            ]);
        }

        if (parsed.pathname === `/api/v10/guilds/${guildId}/members`) {
            const after = parsed.searchParams.get('after');
            if (after && after !== '0') {
                return jsonResponse([]);
            }
            return jsonResponse([{ user: { id: 'discord-user-1' } }]);
        }

        if (parsed.pathname === `/api/v10/channels/${channelId}/messages`) {
            const before = parsed.searchParams.get('before');
            if (before) {
                return jsonResponse([]);
            }
            return jsonResponse(messages);
        }

        return new Response(JSON.stringify({ message: `Unhandled mock path: ${parsed.pathname}` }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return realFetch(input, init);
};

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
