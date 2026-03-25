'use client';

import { useHuddle } from '../model/useHuddle';
import { useHuddleStore } from '../model/huddle.store';
import { HuddleControls } from './HuddleControls';
import { HuddleVideoGrid } from './HuddleVideoGrid';

interface Props {
    currentUserId: string;
    currentUsername: string;
}

/** 허들 패널 — 하단 고정 바 + 확장 시 비디오 그리드 */
export function HuddlePanel({ currentUserId, currentUsername }: Props) {
    const { activeChannelId, participants, localStream, localAudio, localVideo, leaveHuddle, toggleAudio, toggleVideo } = useHuddle(currentUserId);
    const isActive = !!activeChannelId;

    if (!isActive) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-primary bg-bg-primary/95 backdrop-blur-lg lg:left-60">
            <div className="mx-auto max-w-4xl px-4 py-3">
                {localVideo && (
                    <div className="mb-3">
                        <HuddleVideoGrid localStream={localStream} participants={participants} currentUsername={currentUsername} />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-white">허들 진행 중</span>
                        <span className="text-xs text-text-tertiary">{participants.length + 1}명 참여</span>
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
        </div>
    );
}
