'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getChatSocket } from '@/lib/socket';
import { syncPeerVideoTrackSenders } from './mediaTracks';
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
    const videoSenders = useRef<Map<string, RTCRtpSender>>(new Map());
    const audioTrackRef = useRef<MediaStreamTrack | null>(null);
    const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const getActiveVideoTrack = useCallback(() => screenTrackRef.current ?? cameraTrackRef.current, []);

    const refreshLocalStream = useCallback((nextVideoTrack: MediaStreamTrack | null = getActiveVideoTrack()) => {
        const tracks: MediaStreamTrack[] = [];
        if (audioTrackRef.current) tracks.push(audioTrackRef.current);
        if (nextVideoTrack) tracks.push(nextVideoTrack);

        const nextStream = new MediaStream(tracks);
        localStreamRef.current = nextStream;
        store.setLocalStream(nextStream);
        return nextStream;
    }, [getActiveVideoTrack, store]);

    const emitMediaState = useCallback((channelId: string) => {
        getChatSocket().emit('huddle:toggle-media', {
            channelId,
            audio: audioTrackRef.current?.enabled ?? false,
            video: Boolean(screenTrackRef.current ?? cameraTrackRef.current),
        });
    }, []);

    const syncLocalVideoTrack = useCallback(async (nextTrack: MediaStreamTrack | null) => {
        const stream = refreshLocalStream(nextTrack);
        await syncPeerVideoTrackSenders(peers.current.entries(), videoSenders.current, stream, nextTrack);
    }, [refreshLocalStream]);

    const createPeer = useCallback((targetUserId: string, channelId: string, initiator: boolean) => {
        if (peers.current.has(targetUserId)) return peers.current.get(targetUserId)!;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peers.current.set(targetUserId, pc);

        if (localStreamRef.current) {
            for (const track of localStreamRef.current.getAudioTracks()) {
                pc.addTrack(track, localStreamRef.current);
            }
            const videoTrack = getActiveVideoTrack();
            if (videoTrack) {
                videoSenders.current.set(targetUserId, pc.addTrack(videoTrack, localStreamRef.current));
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
    }, [getActiveVideoTrack, store]);

    const closePeer = useCallback((userId: string) => {
        const pc = peers.current.get(userId);
        if (pc) {
            pc.close();
            peers.current.delete(userId);
        }
        videoSenders.current.delete(userId);
    }, []);

    const closeAllPeers = useCallback(() => {
        for (const [, pc] of peers.current) pc.close();
        peers.current.clear();
        videoSenders.current.clear();
    }, []);

    const stopTrack = useCallback((track: MediaStreamTrack | null) => {
        if (!track) return;
        track.onended = null;
        if (track.readyState !== 'ended') track.stop();
    }, []);

    const stopScreenShare = useCallback(async (channelId: string, stopActiveTrack = true) => {
        const screenTrack = screenTrackRef.current;
        if (!screenTrack) return;

        screenTrack.onended = null;
        if (stopActiveTrack && screenTrack.readyState !== 'ended') {
            screenTrack.stop();
        }
        screenTrackRef.current = null;
        store.setSharingScreen(false);

        const fallbackTrack = cameraTrackRef.current;
        await syncLocalVideoTrack(fallbackTrack);
        emitMediaState(channelId);
    }, [emitMediaState, store, syncLocalVideoTrack]);

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
        audioTrackRef.current = stream.getAudioTracks()[0] ?? null;
        cameraTrackRef.current = null;
        screenTrackRef.current = null;
        refreshLocalStream(null);
        store.setLocalAudio(audioTrackRef.current?.enabled ?? true);
        store.setLocalVideo(false);
        store.setSharingScreen(false);
        store.join(channelId);
        getChatSocket().emit('huddle:join', { channelId });
    }, [refreshLocalStream, store]);

    const leaveHuddle = useCallback(() => {
        const channelId = store.activeChannelId;
        if (!channelId) return;
        getChatSocket().emit('huddle:leave', { channelId });
        closeAllPeers();
        stopTrack(screenTrackRef.current);
        stopTrack(cameraTrackRef.current);
        stopTrack(audioTrackRef.current);
        screenTrackRef.current = null;
        cameraTrackRef.current = null;
        audioTrackRef.current = null;
        localStreamRef.current = null;
        store.leave();
    }, [store, closeAllPeers, stopTrack]);

    const toggleAudio = useCallback(() => {
        const audioTrack = audioTrackRef.current;
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            store.setLocalAudio(audioTrack.enabled);
            if (store.activeChannelId) {
                emitMediaState(store.activeChannelId);
            }
        }
    }, [emitMediaState, store]);

    const toggleVideo = useCallback(async () => {
        const channelId = store.activeChannelId;
        if (!channelId) return;

        if (cameraTrackRef.current) {
            stopTrack(cameraTrackRef.current);
            cameraTrackRef.current = null;
            store.setLocalVideo(false);
            if (!screenTrackRef.current) {
                await syncLocalVideoTrack(null);
            }
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
            if (!newTrack) {
                store.setError('카메라 영상을 불러오지 못했습니다.');
                return;
            }
            cameraTrackRef.current = newTrack;
            newTrack.onended = () => {
                cameraTrackRef.current = null;
                store.setLocalVideo(false);
                if (!screenTrackRef.current) {
                    void syncLocalVideoTrack(null).then(() => emitMediaState(channelId));
                }
            };
            store.setLocalVideo(true);
            if (!screenTrackRef.current) {
                await syncLocalVideoTrack(newTrack);
            }
        }
        emitMediaState(channelId);
    }, [emitMediaState, stopTrack, store, syncLocalVideoTrack]);

    const toggleScreenShare = useCallback(async () => {
        const channelId = store.activeChannelId;
        if (!channelId) return;

        if (screenTrackRef.current) {
            await stopScreenShare(channelId);
            return;
        }

        if (!navigator.mediaDevices.getDisplayMedia) {
            store.setError('이 브라우저에서는 화면 공유를 지원하지 않습니다.');
            return;
        }

        let displayStream: MediaStream;
        try {
            displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        } catch (error) {
            if (error instanceof Error && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
                return;
            }
            store.setError('화면 공유를 시작할 수 없습니다. 브라우저 권한이나 시스템 설정을 확인해주세요.');
            return;
        }

        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) {
            store.setError('공유할 화면을 찾지 못했습니다.');
            return;
        }

        screenTrackRef.current = screenTrack;
        screenTrack.onended = () => {
            void stopScreenShare(channelId, false);
        };
        store.setSharingScreen(true);
        await syncLocalVideoTrack(screenTrack);
        emitMediaState(channelId);
    }, [emitMediaState, stopScreenShare, store, syncLocalVideoTrack]);

    useEffect(() => {
        const socket = getChatSocket();

        const onUserJoined = (data: { channelId: string; userId: string }) => {
            if (data.userId === currentUserId || !store.activeChannelId || data.channelId !== store.activeChannelId) return;
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
            if (data.channelId !== store.activeChannelId) return;
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
        sharingScreen: store.sharingScreen,
        error: store.error,
        clearError: () => store.setError(null),
        joinHuddle,
        leaveHuddle,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
    };
}
