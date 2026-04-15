import { resolveHuddleRtcConfig } from './rtcConfig';

describe('resolveHuddleRtcConfig', () => {
    it('설정이 없으면 기본 STUN 서버를 사용한다', () => {
        const config = resolveHuddleRtcConfig({});

        expect(config.iceServers).toEqual([
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]);
        expect(config.iceTransportPolicy).toBe('all');
    });

    it('JSON 기반 TURN 설정과 relay 정책을 읽는다', () => {
        const config = resolveHuddleRtcConfig({
            NEXT_PUBLIC_WEBRTC_ICE_SERVERS: JSON.stringify([
                { urls: ['stun:stun.example.com:3478'] },
                { urls: 'turn:turn.example.com:3478', username: 'slacord', credential: 'secret' },
            ]),
            NEXT_PUBLIC_WEBRTC_ICE_TRANSPORT_POLICY: 'relay',
        });

        expect(config.iceServers).toEqual([
            { urls: 'stun:stun.example.com:3478' },
            { urls: 'turn:turn.example.com:3478', username: 'slacord', credential: 'secret' },
        ]);
        expect(config.iceTransportPolicy).toBe('relay');
    });

    it('comma-separated urls도 ICE 서버 목록으로 해석한다', () => {
        const config = resolveHuddleRtcConfig({
            NEXT_PUBLIC_WEBRTC_ICE_SERVERS: 'stun:stun.example.com:3478, turn:turn.example.com:3478',
        });

        expect(config.iceServers).toEqual([
            {
                urls: ['stun:stun.example.com:3478', 'turn:turn.example.com:3478'],
            },
        ]);
    });

    it('잘못된 JSON은 기본 STUN 설정으로 안전하게 되돌린다', () => {
        const config = resolveHuddleRtcConfig({
            NEXT_PUBLIC_WEBRTC_ICE_SERVERS: '[{"urls":""}]',
        });

        expect(config.iceServers).toEqual([
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]);
    });
});
