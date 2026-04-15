const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

interface HuddleRtcEnv {
    NEXT_PUBLIC_WEBRTC_ICE_SERVERS?: string;
    NEXT_PUBLIC_WEBRTC_ICE_TRANSPORT_POLICY?: string;
}

export function resolveHuddleRtcConfig(env?: HuddleRtcEnv): RTCConfiguration {
    const resolvedEnv = env ?? (process.env as HuddleRtcEnv);
    const configuredServers = parseConfiguredIceServers(resolvedEnv.NEXT_PUBLIC_WEBRTC_ICE_SERVERS);

    return {
        iceServers: configuredServers.length ? configuredServers : DEFAULT_ICE_SERVERS,
        iceTransportPolicy: resolvedEnv.NEXT_PUBLIC_WEBRTC_ICE_TRANSPORT_POLICY === 'relay' ? 'relay' : 'all',
    };
}

function parseConfiguredIceServers(value?: string): RTCIceServer[] {
    if (!value?.trim()) return [];

    try {
        const parsed = JSON.parse(value);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        return entries.flatMap((entry) => {
            const server = normalizeIceServer(entry);
            return server ? [server] : [];
        });
    } catch {
        const urls = value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        if (urls.length === 0) return [];
        return [{ urls: urls.length === 1 ? urls[0] : urls }];
    }
}

function normalizeIceServer(input: unknown): RTCIceServer | null {
    if (typeof input === 'string') {
        const value = input.trim();
        return value ? { urls: value } : null;
    }

    if (!input || typeof input !== 'object') return null;

    const rawUrls = 'urls' in input ? input.urls : null;
    const urls = normalizeUrls(rawUrls);
    if (!urls) return null;

    const server: RTCIceServer = { urls };

    if ('username' in input && typeof input.username === 'string' && input.username.trim()) {
        server.username = input.username.trim();
    }

    if ('credential' in input && typeof input.credential === 'string' && input.credential.trim()) {
        server.credential = input.credential.trim();
    }

    return server;
}

function normalizeUrls(value: unknown): string | string[] | null {
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }

    if (Array.isArray(value)) {
        const urls = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
        if (urls.length === 0) return null;
        return urls.length === 1 ? urls[0] : urls;
    }

    return null;
}
