import {create} from 'zustand';
import { NumFormatTypes } from '~/utils/Constants';
import type { NumFormat } from '~/utils/Constants';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';

interface TradeDataStore {
    symbol: string;
    setSymbol: (symbol: string) => void;
    symbolInfo: SymbolInfoIF | null;
    setSymbolInfo: (symbolInfo: SymbolInfoIF) => void;
    favs: string[];
    setFavs: (favs:string[]) => void;
    addToFavs: (coin: string) => void;
} 

export const useTradeDataStore = create<TradeDataStore>((set, get) => ({
    symbol: 'BTC',
    setSymbol: (symbol: string) => set({ symbol }),
    symbolInfo: null,
    setSymbolInfo: (symbolInfo: SymbolInfoIF) => {
        const prevSymbolInfo = get().symbolInfo;
        if(prevSymbolInfo){
            const lastPriceChange = symbolInfo.markPx - prevSymbolInfo.markPx;
            symbolInfo.lastPriceChange = lastPriceChange;
        }
        set({ symbolInfo })
    },
    favs: [],
    setFavs: (favs: string[]) => set({favs}),
    addToFavs: (coin: string) => {
        if(get().favs.filter(e=> e==coin).length === 0){
            set({favs: [...get().favs, coin]});
        }
    },
}));