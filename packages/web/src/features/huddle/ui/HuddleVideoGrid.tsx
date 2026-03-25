'use client';

import { useEffect, useRef } from 'react';
import type { HuddleParticipant } from '../model/huddle.store';

function VideoTile({ stream, label, muted }: { stream: MediaStream | null | undefined; label: string; muted?: boolean }) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-border-primary bg-bg-tertiary">
            {stream ? (
                <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-hover text-lg font-bold text-white">
                    {label.charAt(0).toUpperCase()}
                </div>
            )}
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{label}</span>
        </div>
    );
}

interface Props {
    localStream: MediaStream | null;
    participants: HuddleParticipant[];
    currentUsername: string;
}

export function HuddleVideoGrid({ localStream, participants, currentUsername }: Props) {
    const total = participants.length + 1;
    const cols = total <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2';

    return (
        <div className={`grid gap-2 ${cols}`}>
            <VideoTile stream={localStream} label={`${currentUsername} (나)`} muted />
            {participants.map((p) => (
                <VideoTile key={p.userId} stream={p.stream} label={p.userId} />
            ))}
        </div>
    );
}
