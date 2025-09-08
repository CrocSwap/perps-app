import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
    Langs,
    NumFormatTypes,
    type LangType,
    type NumFormat,
} from '~/utils/Constants';

type bsColors = `#${string}`;

export interface colorSetIF {
    buy: bsColors;
    sell: bsColors;
}

export const bsColorSets: { [x: string]: colorSetIF } = {
    default: { buy: '#26A69A', sell: '#EF5350' },
    opposite: { buy: '#EF5350', sell: '#26A69A' },
    deuteranopia: {
        buy: '#8C6AFF',
        sell: '#FF796D',
    },
    tritanopia: {
        buy: '#29B6F6',
        sell: '#EC407A',
    },
    protanopia: {
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

    lang: LangType;
    setLang: (lang: LangType) => void;

    bsColor: colorSetNames;
    setBsColor: (c: colorSetNames) => void;
    getBsColor: () => colorSetIF;

    chartTopHeight: number | null;
    setChartTopHeight: (h: number | null) => void;
    resetLayoutHeights: () => void;
};

const LS_KEY = 'VISUAL_SETTINGS';
const DEFAULT_CHART_TOP_HEIGHT: number | null = null;

export const useAppSettings = create<AppSettingsStore>()(
    persist(
        (set, get) => ({
            orderBookMode: 'tab',
            setOrderBookMode: (mode) => set({ orderBookMode: mode }),

            numFormat: NumFormatTypes[0],
            setNumFormat: (numFormat) => set({ numFormat }),
            getNumFormat: () => get().numFormat,

            lang: Langs[0],
            setLang: (lang) => set({ lang }),

            bsColor: 'default',
            setBsColor: (c) => set({ bsColor: c }),
            getBsColor: () => bsColorSets[get().bsColor],

            chartTopHeight: DEFAULT_CHART_TOP_HEIGHT,
            setChartTopHeight: (h) => set({ chartTopHeight: h }),
            resetLayoutHeights: () =>
                set({ chartTopHeight: DEFAULT_CHART_TOP_HEIGHT }),
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (state) => ({
                bsColor: state.bsColor,
                numFormat: state.numFormat,
                lang: state.lang,
                // orderBookMode: state.orderBookMode,
                chartTopHeight: state.chartTopHeight,
            }),
        },
    ),
);
