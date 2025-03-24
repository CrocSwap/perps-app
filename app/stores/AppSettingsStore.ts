import {create} from 'zustand';
import { buySellColors, Langs, NumFormatTypes, type BuySellColor, type LangType, type NumFormat } from '~/utils/Constants';

type bsColors = '--green'|'--red';
interface colorSetIF {
    buy: bsColors;
    sell: bsColors;
}
export const bsColorSets = {
    default: { buy: '--green', sell: '--red' },
    opposite: { buy: '--red', sell: '--green' },
}
export type colorSetNames = keyof typeof bsColorSets;

interface AppSettingsStore {
    orderBookMode: 'tab' | 'stacked' | 'large';
    setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => void;
    numFormat: NumFormat;
    setNumFormat: (numFormat: NumFormat) => void;
    lang: LangType;
    setLang: (lang: LangType) => void;
    buySellColor: BuySellColor;
    setBuySellColor: (buySellColor: BuySellColor) => void;
    isInverseColor: boolean;
    bsColor: colorSetNames;
    setBsColor: (c: colorSetNames) => void;
}

export const useAppSettings = create<AppSettingsStore>((set) => ({
    orderBookMode: 'tab',
    setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => set({ orderBookMode: mode }),
    numFormat: NumFormatTypes[0],
    setNumFormat: (numFormat: NumFormat) => set({ numFormat }),
    lang: Langs[0],
    setLang: (lang: LangType) => set({ lang }),
    buySellColor: buySellColors[0],
    setBuySellColor: (buySellColor: BuySellColor) => {set({ buySellColor }); if(buySellColor.type === 'inverse') {set({ isInverseColor: true })} else {set({ isInverseColor: false })} },
    isInverseColor: false,
    bsColor: 'default',
    setBsColor: (c: colorSetNames) => set({ bsColor: c }),
}));