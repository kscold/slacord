'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getChatSocket } from '@/lib/socket';
import { useHuddleStore } from './huddle.store';

const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useHuddle(currentUserId: string) {
    const store = useHuddleStore();
    const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    const createPeer = useCallback((targetUserId: string, channelId: string, initiator: boolean) => {
        if (peers.current.has(targetUserId)) return peers.current.get(targetUserId)!;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peers.current.set(targetUserId, pc);

        if (localStreamRef.current) {
            for (const track of localStreamRef.current.getTracks()) {
                pc.addTrack(track, localStreamRef.current);
            }
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                getChatSocket().emit('huddle:ice-candidate', { channelId, targetUserId, candidate: e.candidate });
            }
        };

        pc.ontrack = (e) => {
            if (e.streams[0]) {
                store.setParticipantStream(targetUserId, e.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                closePeer(targetUserId);
            }
        };

        if (initiator) {
            pc.createOffer().then((offer) => pc.setLocalDescription(offer)).then(() => {
                getChatSocket().emit('huddle:offer', { channelId, targetUserId, offer: pc.localDescription });
            });
        }

        return pc;
    }, [store]);

    const closePeer = useCallback((userId: string) => {
        const pc = peers.current.get(userId);
        if (pc) {
            pc.close();
            peers.current.delete(userId);
        }
    }, []);

    const closeAllPeers = useCallback(() => {
        for (const [, pc] of peers.current) pc.close();
        peers.current.clear();
    }, []);

    const joinHuddle = useCallback(async (channelId: string) => {
        // 데스크톱 앱: macOS 시스템 권한 먼저 요청
        if (window.slacordDesktop?.isDesktop) {
            const access = await window.slacordDesktop.requestMediaAccess();
            if (!access.microphone) {
                store.setError('마이크 권한이 거부되었습니다. 시스템 환경설정 > 개인정보 보호 > 마이크에서 Slacord를 허용해주세요.');
                return;
            }
        }
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch {
            store.setError('마이크에 접근할 수 없습니다. 시스템 설정에서 마이크 권한을 허용해주세요.');
            return;
        }
        localStreamRef.current = stream;
        store.setLocalStream(stream);
        store.join(channelId);
        getChatSocket().emit('huddle:join', { channelId });
    }, [store]);

    const leaveHuddle = useCallback(() => {
        const channelId = store.activeChannelId;
        if (!channelId) return;
        getChatSocket().emit('huddle:leave', { channelId });
        closeAllPeers();
        if (localStreamRef.current) {
            for (const track of localStreamRef.current.getTracks()) track.stop();
            localStreamRef.current = null;
        }
        store.leave();
    }, [store, closeAllPeers]);

    const toggleAudio = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            store.setLocalAudio(audioTrack.enabled);
            if (store.activeChannelId) {
                getChatSocket().emit('huddle:toggle-media', { channelId: store.activeChannelId, audio: audioTrack.enabled, video: store.localVideo });
            }
        }
    }, [store]);

    const toggleVideo = useCallback(async () => {
        const stream = localStreamRef.current;
        const channelId = store.activeChannelId;
        if (!stream || !channelId) return;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            store.setLocalVideo(videoTrack.enabled);
        } else {
            if (window.slacordDesktop?.isDesktop) {
                const access = await window.slacordDesktop.requestMediaAccess();
                if (!access.camera) {
                    store.setError('카메라 권한이 거부되었습니다. 시스템 환경설정 > 개인정보 보호 > 카메라에서 Slacord를 허용해주세요.');
                    return;
                }
            }
            let videoStream: MediaStream;
            try {
                videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch {
                store.setError('카메라에 접근할 수 없습니다. 시스템 설정에서 카메라 권한을 허용해주세요.');
                return;
            }
            const newTrack = videoStream.getVideoTracks()[0];
            stream.addTrack(newTrack);
            for (const [, pc] of peers.current) {
                pc.addTrack(newTrack, stream);
            }
            store.setLocalVideo(true);
        }
        getChatSocket().emit('huddle:toggle-media', { channelId, audio: store.localAudio, video: !store.localVideo });
    }, [store]);

    useEffect(() => {
        const socket = getChatSocket();

        const onUserJoined = (data: { channelId: string; userId: string }) => {
            if (data.userId === currentUserId || !store.activeChannelId) return;
            createPeer(data.userId, data.channelId, true);
        };
        const onUserLeft = (data: { userId: string }) => {
            closePeer(data.userId);
            store.removeParticipant(data.userId);
        };
        const onOffer = async (data: { channelId: string; fromUserId: string; offer: RTCSessionDescriptionInit }) => {
            const pc = createPeer(data.fromUserId, data.channelId, false);
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('huddle:answer', { channelId: data.channelId, targetUserId: data.fromUserId, answer: pc.localDescription });
        };
        const onAnswer = async (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
            const pc = peers.current.get(data.fromUserId);
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        };
        const onIceCandidate = async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
            const pc = peers.current.get(data.fromUserId);
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        };
        const onParticipants = (data: { channelId: string; participants: { userId: string; audio: boolean; video: boolean }[] }) => {
            store.setParticipants(data.participants.filter((p) => p.userId !== currentUserId));
        };

        socket.on('huddle:user-joined', onUserJoined);
        socket.on('huddle:user-left', onUserLeft);
        socket.on('huddle:offer', onOffer);
        socket.on('huddle:answer', onAnswer);
        socket.on('huddle:ice-candidate', onIceCandidate);
        socket.on('huddle:participants', onParticipants);

        return () => {
            socket.off('huddle:user-joined', onUserJoined);
            socket.off('huddle:user-left', onUserLeft);
            socket.off('huddle:offer', onOffer);
            socket.off('huddle:answer', onAnswer);
            socket.off('huddle:ice-candidate', onIceCandidate);
            socket.off('huddle:participants', onParticipants);
        };
    }, [currentUserId, store, createPeer, closePeer]);

    return {
        activeChannelId: store.activeChannelId,
        participants: store.participants,
        localStream: store.localStream,
        localAudio: store.localAudio,
        localVideo: store.localVideo,
        error: store.error,
        clearError: () => store.setError(null),
        joinHuddle,
        leaveHuddle,
        toggleAudio,
        toggleVideo,
    };
}
