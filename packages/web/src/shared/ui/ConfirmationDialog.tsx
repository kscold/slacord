'use client';

import { useId, useRef } from 'react';
import { useDialogFocusTrap } from './useDialogFocusTrap';

interface Props {
    busy?: boolean;
    cancelLabel?: string;
    confirmLabel: string;
    description: string;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    open: boolean;
    title: string;
    tone?: 'danger' | 'primary';
}

export function ConfirmationDialog({
    busy = false,
    cancelLabel = '취소',
    confirmLabel,
    description,
    onClose,
    onConfirm,
    open,
    title,
    tone = 'primary',
}: Props) {
    const surfaceRef = useRef<HTMLDivElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();

    useDialogFocusTrap({
        initialFocusRef: cancelButtonRef,
        onEscape: busy ? undefined : onClose,
        open,
        surfaceRef,
    });

    if (!open) return null;

    const confirmToneClass =
        tone === 'danger'
            ? 'bg-red-500 text-white hover:bg-red-400 disabled:bg-red-500/60'
            : 'bg-brand-500 text-white hover:bg-brand-400 disabled:bg-brand-500/60';

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() => {
                if (!busy) onClose();
            }}
        >
            <div
                ref={surfaceRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="w-full max-w-md rounded-[28px] border border-white/10 bg-bg-secondary p-6 shadow-2xl outline-none"
                onClick={(event) => event.stopPropagation()}
            >
                <p className="text-xs uppercase tracking-[0.22em] text-brand-200">Confirm Action</p>
                <h2 id={titleId} className="mt-3 text-2xl font-bold text-white">
                    {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{description}</p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-full border border-border-primary px-4 py-2 text-sm text-text-secondary transition hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => void onConfirm()}
                        disabled={busy}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${confirmToneClass}`}
                    >
                        {busy ? '처리 중...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
