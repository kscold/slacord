'use client';

import { useHuddle } from '../model/useHuddle';
import { HuddleControls } from './HuddleControls';
import { HuddleVideoGrid } from './HuddleVideoGrid';

interface Props {
    currentUserId: string;
    currentUsername: string;
    channelName: string;
}

/** 허들 패널 — 슬랙처럼 하단 고정 바 */
export function HuddlePanel({ currentUserId, currentUsername, channelName }: Props) {
    const { activeChannelId, participants, localStream, localAudio, localVideo, error, clearError, leaveHuddle, toggleAudio, toggleVideo } = useHuddle(currentUserId);
    const isActive = !!activeChannelId;

    // 에러 배너
    if (error) {
        return (
            <div className="border-t border-border-primary bg-red-500/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-red-300">{error}</span>
                </div>
                <button onClick={clearError} className="text-xs text-red-400 hover:text-red-300 shrink-0">닫기</button>
            </div>
        );
    }

    if (!isActive) return null;

    return (
        <div className="border-t border-border-primary bg-[#1a1d21]">
            {/* 비디오 그리드 (카메라 켰을 때만) */}
            {localVideo && (
                <div className="px-4 pt-3">
                    <HuddleVideoGrid localStream={localStream} participants={participants} currentUsername={currentUsername} />
                </div>
            )}

            {/* 컴팩트 허들 바 — 슬랙 스타일 */}
            <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">허들</p>
                        <p className="text-[11px] text-text-tertiary truncate">#{channelName} · {participants.length + 1}명</p>
                    </div>
                </div>
                <HuddleControls
                    audio={localAudio}
                    video={localVideo}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                    onLeave={leaveHuddle}
                />
            </div>
        </div>
    );
}
