import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChartLayout } from '~/routes/chart/data/utils/utils';

export const CHART_LAYOUT_KEY = 'perps.tv.chart.layout';

interface ChartStore {
    layout: ChartLayout | null;
    saveLayout: (layout: ChartLayout) => void;
    loadLayout: () => ChartLayout | null;
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

export const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            layout: null,
            saveLayout: (layout) => set({ layout }),
            loadLayout: () => get().layout,
        }),
        {
            name: CHART_LAYOUT_KEY,
            storage: createJSONStorage(ssrSafeStorage),
            version: 1,
            migrate: (persistedState) => {
                if (
                    persistedState &&
                    (persistedState as any) &&
                    !(persistedState as any).interval
                ) {
                    return {
                        layout: {
                            chartLayout: (persistedState as any).layout,
                            interval: '1D',
                        },
                    };
                }
                return persistedState;
            },
        },
    ),
);
