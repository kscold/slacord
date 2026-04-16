'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

export function didPrependItems(previousIds: string[], nextIds: string[]) {
    if (previousIds.length === 0 || nextIds.length <= previousIds.length) return false;
    return previousIds.every((id, index) => nextIds[nextIds.length - previousIds.length + index] === id);
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
    prepareForPrepend: () => void;
    scrollToBottom: () => void;
    showJumpToLatest: boolean;
}

export function useStickyScroll({ itemIds, scrollThreshold = DEFAULT_THRESHOLD }: Options): Result {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const previousItemIdsRef = useRef<string[]>([]);
    const isNearBottomRef = useRef(true);
    const prependSnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
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

    const prepareForPrepend = () => {
        const container = containerRef.current;
        if (!container) return;
        prependSnapshotRef.current = {
            scrollHeight: container.scrollHeight,
            scrollTop: container.scrollTop,
        };
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        isNearBottomRef.current = isNearBottom(getScrollMetrics(container), scrollThreshold);
    }, [scrollThreshold]);

    useLayoutEffect(() => {
        const previousItemIds = previousItemIdsRef.current;
        const firstLoad = previousItemIds.length === 0;
        const appendedNewItem = didAppendNewItem(previousItemIds, itemIds);
        const prependedItems = didPrependItems(previousItemIds, itemIds);
        const container = containerRef.current;

        if (prependedItems && prependSnapshotRef.current && container) {
            const delta = container.scrollHeight - prependSnapshotRef.current.scrollHeight;
            container.scrollTop = prependSnapshotRef.current.scrollTop + delta;
            prependSnapshotRef.current = null;
            previousItemIdsRef.current = itemIds;
            return;
        }

        prependSnapshotRef.current = null;

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
        prepareForPrepend,
        scrollToBottom,
        showJumpToLatest,
    };
}
