import {create} from 'zustand';
import { Langs, NumFormatTypes, type LangType, type NumFormat } from '~/utils/Constants';
import type { OrderBookTradeIF, OrderRowIF } from '~/utils/orderbook/OrderBookIFs';

interface AppSettingsStore {
    orderBookMode: 'tab' | 'stacked' | 'large';
    setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => void;
    numFormat: NumFormat;
    setNumFormat: (numFormat: NumFormat) => void;
    lang: LangType;
    setLang: (lang: LangType) => void;
}

export const useAppSettings = create<AppSettingsStore>((set) => ({
    orderBookMode: 'tab',
    setOrderBookMode: (mode: 'tab' | 'stacked' | 'large') => set({ orderBookMode: mode }),
    numFormat: NumFormatTypes[0],
    setNumFormat: (numFormat: NumFormat) => set({ numFormat }),
    lang: Langs[0],
    setLang: (lang: LangType) => set({ lang })
}));