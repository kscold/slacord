'use client';

import { useEffect, useRef, useState } from 'react';
import { useSupportsHover } from '@/src/shared/model/useSupportsHover';

export function useMessageActionMenu() {
    const supportsHover = useSupportsHover();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open]);

    return {
        containerRef,
        open,
        supportsHover,
        closeMenu: () => setOpen(false),
        openMenu: () => setOpen(true),
        toggleMenu: () => setOpen((current) => !current),
    };
}
