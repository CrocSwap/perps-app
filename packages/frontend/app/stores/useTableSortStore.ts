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

const ssrSafeStorage = () =>
    (typeof window !== 'undefined'
        ? window.localStorage
        : {
              getItem: (_key: string) => null,
              setItem: (_key: string, _value: string) => {},
              removeItem: (_key: string) => {},
              clear: () => {},
              key: (_index: number) => null,
              length: 0,
          }) as Storage;

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
            storage: createJSONStorage(ssrSafeStorage),
        },
    ),
);
