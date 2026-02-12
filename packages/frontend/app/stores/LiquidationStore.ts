import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LiqLevel } from '~/routes/trade/liquidationsChart/LiquidationUtils';
import { TableState } from '~/utils/CommonIFs';

// Default threshold values (USD amounts that separate the 4 color levels)
// Level 1 (purple): < $100K | Level 2 (blue): $100K-$1M | Level 3 (green): $1M-$10M | Level 4 (yellow): > $10M
const DEFAULT_LIQ_THRESHOLDS: [number, number, number] = [
    100_000, 1_000_000, 10_000_000,
];

// Min/Max bounds for thresholds
export const LIQ_THRESHOLD_MIN = 0;
export const LIQ_THRESHOLD_MAX = 100_000_000; // 100M

interface LiquidationStore {
    buyLiqs: LiqLevel[];
    sellLiqs: LiqLevel[];
    setBuyLiqs: (buyLiqs: LiqLevel[]) => void;
    setSellLiqs: (sellLiqs: LiqLevel[]) => void;
    loadingState: TableState;
    setLoadingState: (loadingState: TableState) => void;
    maxLiqUSD: number;
    setMaxLiqUSD: (maxLiqUSD: number) => void;
    minLiqUSD: number;
    setMinLiqUSD: (minLiqUSD: number) => void;
    // 3 threshold values (USD) that define boundaries between 4 color levels
    liqThresholds: [number, number, number];
    setLiqThresholds: (thresholds: [number, number, number]) => void;
    setLiqThresholdLow: (value: number) => void;
    setLiqThresholdHigh: (value: number) => void;
    resetLiqThresholds: () => void;
}

export const useLiquidationStore = create<LiquidationStore>()(
    persist(
        (set) => ({
            buyLiqs: [],
            sellLiqs: [],
            setBuyLiqs: (buyLiqs: LiqLevel[]) => set({ buyLiqs }),
            setSellLiqs: (sellLiqs: LiqLevel[]) => set({ sellLiqs }),
            loadingState: TableState.LOADING,
            setLoadingState: (loadingState: TableState) =>
                set({ loadingState }),
            maxLiqUSD: 0,
            setMaxLiqUSD: (maxLiqUSD: number) => set({ maxLiqUSD }),
            minLiqUSD: 0,
            setMinLiqUSD: (minLiqUSD: number) => set({ minLiqUSD }),
            liqThresholds: DEFAULT_LIQ_THRESHOLDS,
            setLiqThresholds: (thresholds: [number, number, number]) =>
                set({ liqThresholds: thresholds }),
            setLiqThresholdLow: (value: number) =>
                set((state) => ({
                    liqThresholds: [
                        value,
                        // Mid is geometric mean of low and high
                        Math.sqrt(value * state.liqThresholds[2]),
                        state.liqThresholds[2],
                    ],
                })),
            setLiqThresholdHigh: (value: number) =>
                set((state) => ({
                    liqThresholds: [
                        state.liqThresholds[0],
                        // Mid is geometric mean of low and high
                        Math.sqrt(state.liqThresholds[0] * value),
                        value,
                    ],
                })),
            resetLiqThresholds: () =>
                set({ liqThresholds: DEFAULT_LIQ_THRESHOLDS }),
        }),
        {
            name: 'LIQCHART',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ liqThresholds: state.liqThresholds }),
        },
    ),
);
