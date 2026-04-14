import type { HuddleParticipant } from './huddle.store';

export interface VideoTrackSender {
    replaceTrack: (track: MediaStreamTrack | null) => Promise<void> | void;
}

export interface VideoPeerConnection {
    addTrack: (track: MediaStreamTrack, stream: MediaStream) => VideoTrackSender;
}

export async function syncPeerVideoTrackSenders<TSender extends VideoTrackSender, TPeerConnection extends VideoPeerConnection>(
    peerConnections: Iterable<[string, TPeerConnection]>,
    videoSenders: Map<string, TSender>,
    stream: MediaStream,
    nextTrack: MediaStreamTrack | null,
) {
    for (const [userId, peerConnection] of peerConnections) {
        const sender = videoSenders.get(userId);

        if (sender) {
            await sender.replaceTrack(nextTrack);
            continue;
        }

        if (!nextTrack) continue;
        videoSenders.set(userId, peerConnection.addTrack(nextTrack, stream) as TSender);
    }
}

export function shouldShowHuddleVideoGrid(input: {
    localVideo: boolean;
    sharingScreen: boolean;
    participants: HuddleParticipant[];
}) {
    if (input.localVideo || input.sharingScreen) return true;
    return input.participants.some((participant) => participant.video);
}
