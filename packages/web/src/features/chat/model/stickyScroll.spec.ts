import { describe, expect, it } from 'vitest';
import { didAppendNewItem, isNearBottom } from './stickyScroll';

describe('isNearBottom', () => {
    it('returns true when the remaining distance is within the threshold', () => {
        expect(
            isNearBottom({
                clientHeight: 600,
                scrollHeight: 1280,
                scrollTop: 590,
            }),
        ).toBe(true);
    });

    it('returns false when the remaining distance is larger than the threshold', () => {
        expect(
            isNearBottom({
                clientHeight: 600,
                scrollHeight: 1600,
                scrollTop: 700,
            }),
        ).toBe(false);
    });
});

describe('didAppendNewItem', () => {
    it('detects when a new item is appended to the end', () => {
        expect(didAppendNewItem(['m1', 'm2'], ['m1', 'm2', 'm3'])).toBe(true);
    });

    it('does not flag edits or removals as appended items', () => {
        expect(didAppendNewItem(['m1', 'm2'], ['m1', 'm2'])).toBe(false);
        expect(didAppendNewItem(['m1', 'm2', 'm3'], ['m1', 'm2'])).toBe(false);
    });
});
