import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChartLayout } from '~/routes/chart/data/utils/utils';
import type { Bar } from '~/tv/charting_library/datafeed-api';

export const CHART_LAYOUT_KEY = 'perps.tv.chart.layout';

interface ChartStore {
    layout: ChartLayout | null;
    saveLayout: (layout: ChartLayout) => void;
    loadLayout: () => ChartLayout | null;
    lastCandle: Bar | null;
    setLastCandle: (candle: Bar | null) => void;
}

export const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            layout: null,
            saveLayout: (layout) => set({ layout }),
            loadLayout: () => get().layout,
            lastCandle: null,
            setLastCandle: (candle) => set({ lastCandle: candle }),
        }),
        {
            name: CHART_LAYOUT_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (state) => ({
                layout: state.layout,
            }),
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
