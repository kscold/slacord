'use client';

import { useEffect, useState } from 'react';

export function DesktopDragBar() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(Boolean(window.slacordDesktop?.isDesktop && window.slacordDesktop.platform === 'darwin'));
    }, []);

    if (!show) return null;

    return (
        <div
            className="fixed inset-x-0 top-0 z-[100] h-7 desktop-drag-region"
            style={{ pointerEvents: 'auto' }}
        />
    );
}
