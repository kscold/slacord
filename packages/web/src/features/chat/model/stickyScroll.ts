'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

const DEFAULT_THRESHOLD = 120;

interface ScrollMetrics {
    clientHeight: number;
    scrollHeight: number;
    scrollTop: number;
}

export function isNearBottom(metrics: ScrollMetrics, threshold = DEFAULT_THRESHOLD) {
    const distanceFromBottom = metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop;
    return distanceFromBottom <= threshold;
}

export function didAppendNewItem(previousIds: string[], nextIds: string[]) {
    if (nextIds.length <= previousIds.length) return false;
    if (previousIds.length === 0) return true;
    return previousIds[previousIds.length - 1] !== nextIds[nextIds.length - 1];
}

function getScrollMetrics(container: HTMLElement) {
    return {
        clientHeight: container.clientHeight,
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
    };
}

interface Options {
    itemIds: string[];
    scrollThreshold?: number;
}

interface Result {
    bottomRef: RefObject<HTMLDivElement | null>;
    containerRef: RefObject<HTMLDivElement | null>;
    handleScroll: () => void;
    scrollToBottom: () => void;
    showJumpToLatest: boolean;
}

export function useStickyScroll({ itemIds, scrollThreshold = DEFAULT_THRESHOLD }: Options): Result {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const previousItemIdsRef = useRef<string[]>([]);
    const isNearBottomRef = useRef(true);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowJumpToLatest(false);
    };

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const nearBottom = isNearBottom(getScrollMetrics(container), scrollThreshold);
        isNearBottomRef.current = nearBottom;
        if (nearBottom) {
            setShowJumpToLatest(false);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        isNearBottomRef.current = isNearBottom(getScrollMetrics(container), scrollThreshold);
    }, [scrollThreshold]);

    useEffect(() => {
        const previousItemIds = previousItemIdsRef.current;
        const firstLoad = previousItemIds.length === 0;
        const appendedNewItem = didAppendNewItem(previousItemIds, itemIds);

        if (firstLoad || isNearBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: firstLoad ? 'auto' : 'smooth' });
            setShowJumpToLatest(false);
        } else if (appendedNewItem) {
            setShowJumpToLatest(true);
        }

        previousItemIdsRef.current = itemIds;
    }, [itemIds]);

    return {
        bottomRef,
        containerRef,
        handleScroll,
        scrollToBottom,
        showJumpToLatest,
    };
}
