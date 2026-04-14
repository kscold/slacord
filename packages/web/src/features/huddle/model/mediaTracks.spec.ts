import { shouldShowHuddleVideoGrid, syncPeerVideoTrackSenders, type VideoPeerConnection, type VideoTrackSender } from './mediaTracks';

function makeSender() {
    return {
        replaceTrack: vi.fn(async () => undefined),
    } satisfies VideoTrackSender;
}

function makePeerConnection(sender: VideoTrackSender) {
    return {
        addTrack: vi.fn(() => sender),
    } satisfies VideoPeerConnection;
}

describe('mediaTracks', () => {
    it('기존 sender가 있으면 replaceTrack으로 영상 트랙을 교체함', async () => {
        const sender = makeSender();
        const peerConnection = makePeerConnection(sender);
        const videoSenders = new Map([['user-1', sender]]);
        const stream = {} as MediaStream;
        const nextTrack = { kind: 'video' } as MediaStreamTrack;

        await syncPeerVideoTrackSenders([['user-1', peerConnection]], videoSenders, stream, nextTrack);

        expect(sender.replaceTrack).toHaveBeenCalledWith(nextTrack);
        expect(peerConnection.addTrack).not.toHaveBeenCalled();
    });

    it('sender가 없고 새 영상 트랙이 있으면 peer에 addTrack을 붙임', async () => {
        const sender = makeSender();
        const peerConnection = makePeerConnection(sender);
        const videoSenders = new Map<string, VideoTrackSender>();
        const stream = {} as MediaStream;
        const nextTrack = { kind: 'video' } as MediaStreamTrack;

        await syncPeerVideoTrackSenders([['user-2', peerConnection]], videoSenders, stream, nextTrack);

        expect(peerConnection.addTrack).toHaveBeenCalledWith(nextTrack, stream);
        expect(videoSenders.get('user-2')).toBe(sender);
    });

    it('활성 로컬 영상이 없어도 원격 참여자 영상이 있으면 비디오 그리드를 보여줌', () => {
        const result = shouldShowHuddleVideoGrid({
            localVideo: false,
            sharingScreen: false,
            participants: [{ userId: 'user-1', audio: true, video: true }],
        });

        expect(result).toBe(true);
    });

    it('모든 참여자가 음성만 쓰면 비디오 그리드를 숨김', () => {
        const result = shouldShowHuddleVideoGrid({
            localVideo: false,
            sharingScreen: false,
            participants: [{ userId: 'user-1', audio: true, video: false }],
        });

        expect(result).toBe(false);
    });
});
