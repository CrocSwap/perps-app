import { create } from 'zustand';
import { setLS } from '~/utils/AppUtils';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import { createUserTradesSlice, type UserTradeStore } from './UserOrderStore';

type TradeDataStore = UserTradeStore & {
    symbol: string;
    setSymbol: (symbol: string) => void;
    symbolInfo: SymbolInfoIF | null;
    setSymbolInfo: (symbolInfo: SymbolInfoIF) => void;
    favs: string[];
    setFavs: (favs: string[]) => void;
    addToFavs: (coin: string) => void;
};

const useTradeDataStore = create<TradeDataStore>((set, get) => ({
    ...createUserTradesSlice(set, get),
    symbol: 'BTC',
    setSymbol: (symbol: string) => {
        setLS('activeCoin', symbol);
        set({ symbol });
        get().setUserSymbolOrders(
            get().userOrders.filter((e) => e.coin === symbol),
        );
    },
    symbolInfo: null,
    setSymbolInfo: (symbolInfo: SymbolInfoIF) => {
        const prevSymbolInfo = get().symbolInfo;
        if (prevSymbolInfo) {
            const lastPriceChange = symbolInfo.markPx - prevSymbolInfo.markPx;
            symbolInfo.lastPriceChange = lastPriceChange;
        }
        set({ symbolInfo });
    },
    favs: [],
    setFavs: (favs: string[]) => set({ favs }),
    addToFavs: (coin: string) => {
        if (get().favs.filter((e) => e == coin).length === 0) {
            set({ favs: [...get().favs, coin] });
        }
    },
}));

export { useTradeDataStore };
