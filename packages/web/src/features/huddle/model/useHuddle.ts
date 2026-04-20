'use client';

import { useCallback, useRef } from 'react';
import { getChatSocket } from '@/lib/socket';
import { syncPeerVideoTrackSenders } from './mediaTracks';
import {
    HUDDLE_RECOVERY_FAILED_MESSAGE,
    HUDDLE_RECOVERY_MESSAGE,
    MAX_HUDDLE_RECOVERY_ATTEMPTS,
    isHuddleRecoveryMessage,
    nextHuddleRecoveryDelay,
    shouldInitiateHuddleRecovery,
} from './recovery';
import { resolveHuddleRtcConfig } from './rtcConfig';
import { useHuddleStore } from './huddle.store';
import { useHuddleSignaling } from './useHuddleSignaling';

export function useHuddle(currentUserId: string) {
    const store = useHuddleStore();
    const rtcConfigRef = useRef<RTCConfiguration>(resolveHuddleRtcConfig());
    const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
    const videoSenders = useRef<Map<string, RTCRtpSender>>(new Map());
    const reconnectTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const reconnectAttempts = useRef<Map<string, number>>(new Map());
    const recoverySchedulerRef = useRef<(targetUserId: string, channelId: string) => void>(() => undefined);
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

    const clearRecoveryErrorIfIdle = useCallback(() => {
        if (reconnectTimers.current.size > 0) return;
        if (isHuddleRecoveryMessage(useHuddleStore.getState().error)) {
            useHuddleStore.getState().setError(null);
        }
    }, []);

    const clearPeerRecovery = useCallback((targetUserId: string) => {
        const timer = reconnectTimers.current.get(targetUserId);
        if (timer) clearTimeout(timer);
        reconnectTimers.current.delete(targetUserId);
        reconnectAttempts.current.delete(targetUserId);
        clearRecoveryErrorIfIdle();
    }, [clearRecoveryErrorIfIdle]);

    const closePeer = useCallback((userId: string) => {
        const pc = peers.current.get(userId);
        if (pc) {
            pc.onconnectionstatechange = null;
            pc.oniceconnectionstatechange = null;
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.close();
            peers.current.delete(userId);
        }
        videoSenders.current.delete(userId);
        clearPeerRecovery(userId);
    }, [clearPeerRecovery]);

    const createPeer = useCallback((targetUserId: string, channelId: string, initiator: boolean) => {
        const existingPeer = peers.current.get(targetUserId);
        if (existingPeer && existingPeer.connectionState !== 'closed') return existingPeer;
        if (existingPeer) closePeer(targetUserId);

        const pc = new RTCPeerConnection(rtcConfigRef.current);
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

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                getChatSocket().emit('huddle:ice-candidate', { channelId, targetUserId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams[0]) {
                store.setParticipantStream(targetUserId, event.streams[0]);
            }
        };

        const handleHealthyState = () => {
            clearPeerRecovery(targetUserId);
        };

        const handleUnstableState = () => {
            recoverySchedulerRef.current(targetUserId, channelId);
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                handleHealthyState();
                return;
            }
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                handleUnstableState();
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                handleHealthyState();
                return;
            }
            if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                handleUnstableState();
            }
        };

        if (initiator) {
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                    getChatSocket().emit('huddle:offer', { channelId, targetUserId, offer: pc.localDescription });
                })
                .catch(() => {
                    recoverySchedulerRef.current(targetUserId, channelId);
                });
        }

        return pc;
    }, [clearPeerRecovery, closePeer, getActiveVideoTrack, store]);

    const schedulePeerRecovery = useCallback((targetUserId: string, channelId: string) => {
        if (useHuddleStore.getState().activeChannelId !== channelId) return;
        if (reconnectTimers.current.has(targetUserId)) return;

        useHuddleStore.getState().setError(HUDDLE_RECOVERY_MESSAGE);

        if (!shouldInitiateHuddleRecovery(currentUserId, targetUserId)) {
            return;
        }

        const attempt = (reconnectAttempts.current.get(targetUserId) ?? 0) + 1;
        reconnectAttempts.current.set(targetUserId, attempt);

        if (attempt > MAX_HUDDLE_RECOVERY_ATTEMPTS) {
            useHuddleStore.getState().setError(HUDDLE_RECOVERY_FAILED_MESSAGE);
            return;
        }

        const timer = setTimeout(() => {
            reconnectTimers.current.delete(targetUserId);

            if (useHuddleStore.getState().activeChannelId !== channelId) return;

            const existingPeer = peers.current.get(targetUserId);
            if (!existingPeer || existingPeer.connectionState === 'closed') {
                createPeer(targetUserId, channelId, true);
                return;
            }

            void (async () => {
                try {
                    if (typeof existingPeer.restartIce === 'function') {
                        existingPeer.restartIce();
                    }
                    const offer = await existingPeer.createOffer({ iceRestart: true });
                    await existingPeer.setLocalDescription(offer);
                    getChatSocket().emit('huddle:offer', { channelId, targetUserId, offer: existingPeer.localDescription });
                } catch {
                    closePeer(targetUserId);
                    createPeer(targetUserId, channelId, true);
                }
            })();
        }, nextHuddleRecoveryDelay(attempt));

        reconnectTimers.current.set(targetUserId, timer);
    }, [closePeer, createPeer, currentUserId]);

    recoverySchedulerRef.current = schedulePeerRecovery;

    const closeAllPeers = useCallback(() => {
        for (const userId of peers.current.keys()) {
            closePeer(userId);
        }
        peers.current.clear();
        videoSenders.current.clear();
    }, [closePeer]);

    const clearAllRecovery = useCallback(() => {
        for (const timer of reconnectTimers.current.values()) {
            clearTimeout(timer);
        }
        reconnectTimers.current.clear();
        reconnectAttempts.current.clear();
        clearRecoveryErrorIfIdle();
    }, [clearRecoveryErrorIfIdle]);

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
        const channelId = useHuddleStore.getState().activeChannelId;
        if (!channelId) return;

        getChatSocket().emit('huddle:leave', { channelId });
        closeAllPeers();
        clearAllRecovery();
        stopTrack(screenTrackRef.current);
        stopTrack(cameraTrackRef.current);
        stopTrack(audioTrackRef.current);
        screenTrackRef.current = null;
        cameraTrackRef.current = null;
        audioTrackRef.current = null;
        localStreamRef.current = null;
        store.leave();
    }, [clearAllRecovery, closeAllPeers, stopTrack, store]);

    const toggleAudio = useCallback(() => {
        const audioTrack = audioTrackRef.current;
        if (!audioTrack) return;

        audioTrack.enabled = !audioTrack.enabled;
        store.setLocalAudio(audioTrack.enabled);
        if (store.activeChannelId) {
            emitMediaState(store.activeChannelId);
        }
    }, [emitMediaState, store]);

    const toggleVideo = useCallback(async () => {
        const channelId = useHuddleStore.getState().activeChannelId;
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
        const channelId = useHuddleStore.getState().activeChannelId;
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

    useHuddleSignaling({
        currentUserId,
        isActiveChannel: (channelId) => useHuddleStore.getState().activeChannelId === channelId,
        emitMediaState,
        onUserJoined: (channelId, userId) => {
            createPeer(userId, channelId, true);
        },
        onUserLeft: (userId) => {
            closePeer(userId);
            store.removeParticipant(userId);
        },
        onOffer: async (channelId, fromUserId, offer) => {
            let pc = peers.current.get(fromUserId);
            if (pc && pc.signalingState !== 'stable') {
                closePeer(fromUserId);
                pc = undefined;
            }

            const nextPeer = pc ?? createPeer(fromUserId, channelId, false);
            await nextPeer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await nextPeer.createAnswer();
            await nextPeer.setLocalDescription(answer);
            getChatSocket().emit('huddle:answer', {
                channelId,
                targetUserId: fromUserId,
                answer: nextPeer.localDescription,
            });
        },
        onAnswer: async (fromUserId, answer) => {
            const pc = peers.current.get(fromUserId);
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        },
        onIceCandidate: async (fromUserId, candidate) => {
            const pc = peers.current.get(fromUserId);
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        },
        onCleanup: () => {
            clearAllRecovery();
            closeAllPeers();
        },
    });

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
