'use client';

import { useRef } from 'react';

interface Props {
    open: boolean;
    onToggle: () => void;
}

/** 채널 섹션 헤더 우측의 "+" 토글 버튼 — 폼 자체는 TeamSidebar 인라인으로 렌더링됨 */
export function CreateChannelButton({ open, onToggle }: Props) {
    return (
        <button
            onClick={onToggle}
            aria-label={open ? '채널 만들기 취소' : '채널 만들기'}
            title={open ? '취소' : '채널 만들기'}
            className={`rounded p-0.5 transition hover:bg-bg-hover ${open ? 'text-white' : 'text-text-tertiary hover:text-white'}`}
        >
            <svg
                className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-45' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </button>
    );
}
