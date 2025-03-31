import {create} from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyChartColors } from '~/utils/chartUtils';
import {
    // buySellColors,
    Langs, NumFormatTypes,
    // type BuySellColor,
    type LangType, type NumFormat } from '~/utils/Constants';

type bsColors = '--green'|'--red'|`#${string}`;

export interface colorSetIF {
    buy: bsColors;
    sell: bsColors;
}

export const bsColorSets: { [x: string]: colorSetIF } = {
    default: { buy: '--green', sell: '--red' },
    opposite: { buy: '--red', sell: '--green' },
    deuteranopia: {
		buy: '#8C6AFF',
		sell: '#FF796D',
	},
	tritanopia: {
		buy: '#29B6F6',
		sell: '#EC407A',
	},
	protanopia: {
		buy: '#7F8E9E',
		sell: '#4DBE71',
	},
}

export type colorSetNames = keyof typeof bsColorSets;

type AppSettingsStore = {
    orderBookMode: 'tab' | 'stacked' | 'large';
    setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => void;
    numFormat: NumFormat;
    setNumFormat: (numFormat: NumFormat) => void;
    lang: LangType;
    setLang: (lang: LangType) => void;
    // buySellColor: BuySellColor;
    // setBuySellColor: (buySellColor: BuySellColor) => void;
    // isInverseColor: boolean;
    bsColor: colorSetNames;
    setBsColor: (c: colorSetNames) => void;
    getBsColor: () => colorSetIF;
}

const LS_KEY = 'VISUAL_SETTINGS';

export const useAppSettings = create<AppSettingsStore>()(
    persist(
        (set, get) => ({
            orderBookMode: 'tab',
            setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => set({ orderBookMode: mode }),
            numFormat: NumFormatTypes[0],
            setNumFormat: (numFormat: NumFormat) => set({ numFormat }),
            lang: Langs[0],
            setLang: (lang: LangType) => set({ lang }),
            // buySellColor: buySellColors[0],
            // setBuySellColor: (buySellColor: BuySellColor) => {set({ buySellColor }); if(buySellColor.type === 'inverse') {set({ isInverseColor: true })} else {set({ isInverseColor: false })} },
            // isInverseColor: false,
            bsColor: 'default',
            setBsColor: (c: colorSetNames) => {
                set({ bsColor: c });
               
                applyChartColors(bsColorSets[c]);
            },            getBsColor: () => bsColorSets[get().bsColor],
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ bsColor: state.bsColor }),
        },
    ),
);
