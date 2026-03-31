'use client';

import { useEffect, useState } from 'react';

export function useSupportsHover() {
    const [supportsHover, setSupportsHover] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

        const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const sync = () => setSupportsHover(mediaQuery.matches);

        sync();
        mediaQuery.addEventListener('change', sync);
        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    return supportsHover;
}
