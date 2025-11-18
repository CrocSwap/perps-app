/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TableSortDirection } from '~/utils/CommonIFs';

type SortState<S> = {
    sortBy?: S;
    sortDirection?: TableSortDirection;
};

interface TableSortStore<S> {
    entries: Record<string, SortState<S>>;
    setSort: (
        tableId: string,
        sortBy?: S,
        sortDirection?: TableSortDirection,
    ) => void;
}

export const useTableSortStore = create<TableSortStore<any>>()(
    persist(
        (set) => ({
            entries: {},
            setSort: (tableId, sortBy, sortDirection) =>
                set((state) => ({
                    entries: {
                        ...state.entries,
                        [tableId]: { sortBy, sortDirection },
                    },
                })),
        }),
        {
            name: 'table-sort-store',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
