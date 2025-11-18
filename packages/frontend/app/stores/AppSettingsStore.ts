import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { NumFormatTypes, type NumFormat } from '~/utils/Constants';

type bsColors = `#${string}`;

export interface colorSetIF {
    buy: bsColors;
    sell: bsColors;
}

export const bsColorSets: { [x: string]: colorSetIF } = {
    'colors.default': { buy: '#26A69A', sell: '#EF5350' },
    'colors.opposite': { buy: '#EF5350', sell: '#26A69A' },
    'colors.deuteranopia': {
        buy: '#8C6AFF',
        sell: '#FF796D',
    },
    'colors.tritanopia': {
        buy: '#29B6F6',
        sell: '#EC407A',
    },
    'colors.protanopia': {
        buy: '#4DBE71',
        sell: '#7F8E9E',
    },
};

export type colorSetNames = keyof typeof bsColorSets;

type AppSettingsStore = {
    // Existing settings
    orderBookMode: 'tab' | 'stacked' | 'large';
    setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => void;

    numFormat: NumFormat;
    setNumFormat: (numFormat: NumFormat) => void;
    getNumFormat: () => NumFormat;

    bsColor: colorSetNames;
    setBsColor: (c: colorSetNames) => void;
    getBsColor: () => colorSetIF;

    chartTopHeight: number | null;
    setChartTopHeight: (h: number | null) => void;
    resetLayoutHeights: () => void;

    isWalletCollapsed: boolean;
    setIsWalletCollapsed: (collapsed: boolean) => void;
};

const LS_KEY = 'VISUAL_SETTINGS';
const DEFAULT_CHART_TOP_HEIGHT: number | null = null;
const DEFAULT_WALLET_COLLAPSED = false;

export const useAppSettings = create<AppSettingsStore>()(
    persist(
        (set, get) => ({
            orderBookMode: 'tab',
            setOrderBookMode: (mode) => set({ orderBookMode: mode }),

            numFormat: NumFormatTypes[0],
            setNumFormat: (numFormat) => set({ numFormat }),
            getNumFormat: () => get().numFormat,

            bsColor: 'colors.default',
            setBsColor: (c) => set({ bsColor: c }),
            getBsColor: () => bsColorSets[get().bsColor] ?? 'colors.default',

            chartTopHeight: DEFAULT_CHART_TOP_HEIGHT,
            setChartTopHeight: (h) => set({ chartTopHeight: h }),
            resetLayoutHeights: () =>
                set({
                    chartTopHeight: DEFAULT_CHART_TOP_HEIGHT,
                    isWalletCollapsed: DEFAULT_WALLET_COLLAPSED,
                }),
            isWalletCollapsed: DEFAULT_WALLET_COLLAPSED,
            setIsWalletCollapsed: (collapsed) =>
                set({ isWalletCollapsed: collapsed }),
        }),

        {
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 4,
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as AppSettingsStore;

                if (version < 3) {
                    return {
                        ...(persistedState as AppSettingsStore),
                        bsColor: 'colors.default',
                    };
                }
                if (version < 4) {
                    return {
                        ...state,
                        isWalletCollapsed: DEFAULT_WALLET_COLLAPSED,
                    };
                }

                return persistedState;
            },

            partialize: (state) => ({
                bsColor: state.bsColor,
                numFormat: state.numFormat,
                // orderBookMode: state.orderBookMode,
                chartTopHeight: state.chartTopHeight,
                isWalletCollapsed: state.isWalletCollapsed,
            }),
        },
    ),
);
