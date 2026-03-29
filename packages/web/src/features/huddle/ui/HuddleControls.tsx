'use client';

interface Props {
    audio: boolean;
    video: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onLeave: () => void;
}

export function HuddleControls({ audio, video, onToggleAudio, onToggleVideo, onLeave }: Props) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onToggleAudio}
                className={`rounded-full p-2 transition ${audio ? 'text-white hover:bg-white/10' : 'bg-red-500/20 text-red-400'}`}
                title={audio ? '음소거' : '음소거 해제'}
            >
                {audio ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                )}
            </button>
            <button
                onClick={onToggleVideo}
                className={`rounded-full p-2 transition ${video ? 'text-white hover:bg-white/10' : 'text-text-tertiary hover:bg-white/10'}`}
                title={video ? '카메라 끄기' : '카메라 켜기'}
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
            <button
                onClick={onLeave}
                className="ml-1 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700"
                title="나가기"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
            </button>
        </div>
    );
}
