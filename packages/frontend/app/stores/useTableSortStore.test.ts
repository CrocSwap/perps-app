import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createLocalStorageMock() {
    const entries = new Map<string, string>();

    return {
        getItem: vi.fn((key: string) => entries.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            entries.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            entries.delete(key);
        }),
        clear: vi.fn(() => {
            entries.clear();
        }),
        key: vi.fn(
            (index: number) => Array.from(entries.keys())[index] ?? null,
        ),
        get length() {
            return entries.size;
        },
    };
}

describe('useTableSortStore', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('localStorage', createLocalStorageMock());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('stores independent sort state per table id', async () => {
        const { useTableSortStore } = await import('./useTableSortStore');

        useTableSortStore.getState().setSort('open-orders', 'price', 'desc');
        useTableSortStore.getState().setSort('positions', 'pnl', 'asc');

        expect(useTableSortStore.getState().entries).toEqual({
            'open-orders': { sortBy: 'price', sortDirection: 'desc' },
            positions: { sortBy: 'pnl', sortDirection: 'asc' },
        });
    });

    it('persists sort entries through zustand storage', async () => {
        const { useTableSortStore } = await import('./useTableSortStore');

        useTableSortStore.getState().setSort('fills', 'time', 'desc');

        expect(localStorage.setItem).toHaveBeenCalledWith(
            'table-sort-store',
            expect.stringContaining('"fills"'),
        );
    });
});
