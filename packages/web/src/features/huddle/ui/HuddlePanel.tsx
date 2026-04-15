'use client';

import { shouldShowHuddleVideoGrid } from '../model/mediaTracks';
import type { HuddleParticipant } from '../model/huddle.store';
import { HuddleControls } from './HuddleControls';
import { HuddleVideoGrid } from './HuddleVideoGrid';

interface Props {
    activeChannelId: string | null;
    participants: HuddleParticipant[];
    localStream: MediaStream | null;
    localAudio: boolean;
    localVideo: boolean;
    sharingScreen: boolean;
    error: string | null;
    clearError: () => void;
    leaveHuddle: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => void;
    currentUsername: string;
    channelName: string;
}

/** 허들 패널 — 슬랙처럼 하단 고정 바 */
export function HuddlePanel({
    activeChannelId,
    participants,
    localStream,
    localAudio,
    localVideo,
    sharingScreen,
    error,
    clearError,
    leaveHuddle,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    currentUsername,
    channelName,
}: Props) {
    const isActive = Boolean(activeChannelId);
    const showVideoGrid = shouldShowHuddleVideoGrid({ localVideo, sharingScreen, participants });
    const localVisualLabel = sharingScreen ? '화면 공유' : localVideo ? '카메라' : null;

    if (!isActive && !error) return null;

    return (
        <div className="border-t border-border-primary bg-[#1a1d21]">
            {error && (
                <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm text-red-300">{error}</span>
                    </div>
                    <button onClick={clearError} className="shrink-0 text-xs text-red-400 transition hover:text-red-300">닫기</button>
                </div>
            )}

            {isActive && (
                <>
                    {showVideoGrid && (
                        <div className="px-4 pt-3">
                            <HuddleVideoGrid
                                localStream={localStream}
                                participants={participants}
                                currentUsername={currentUsername}
                                localVisualLabel={localVisualLabel}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <div className="relative">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-white">허들</p>
                                <p className="truncate text-[11px] text-text-tertiary">#{channelName} · {participants.length + 1}명{sharingScreen ? ' · 화면 공유 중' : ''}</p>
                            </div>
                        </div>
                        <HuddleControls
                            audio={localAudio}
                            video={localVideo}
                            sharingScreen={sharingScreen}
                            onToggleAudio={toggleAudio}
                            onToggleVideo={toggleVideo}
                            onToggleScreenShare={toggleScreenShare}
                            onLeave={leaveHuddle}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
