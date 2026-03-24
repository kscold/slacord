'use client';

import { useEffect, useState } from 'react';

export function useDesktopMac() {
    const [isDesktopMac, setIsDesktopMac] = useState(false);

    useEffect(() => {
        setIsDesktopMac(Boolean(window.slacordDesktop?.isDesktop && window.slacordDesktop.platform === 'darwin'));
    }, []);

    return isDesktopMac;
}
