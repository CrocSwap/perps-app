import { create } from 'zustand';
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
const useTradeDataStore = create<TradeDataStore>((set, get) => {
    // Retrieve stored symbol from local storage
    let storedSymbol = '';

    // Ensure we're in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
        storedSymbol = localStorage.getItem('activeCoin') || 'BTC';
    }

    return {
        ...createUserTradesSlice(set, get),
        symbol: '', // Initialize state with hardcoded value
        setSymbol: (symbol: string) => {
            localStorage.setItem('activeCoin', symbol); // Update local storage
            set({ symbol });
            get().setUserSymbolOrders(
                get().userOrders.filter((e) => e.coin === symbol),
            );
        },
        symbolInfo: null,
        setSymbolInfo: (symbolInfo: SymbolInfoIF) => {
            const prevSymbolInfo = get().symbolInfo;
            if (prevSymbolInfo) {
                const lastPriceChange =
                    symbolInfo.markPx - prevSymbolInfo.markPx;
                symbolInfo.lastPriceChange = lastPriceChange;
            }
            set({ symbolInfo });
        },
        favs: [],
        setFavs: (favs: string[]) => set({ favs }),
        addToFavs: (coin: string) => {
            if (!get().favs.includes(coin)) {
                set({ favs: [...get().favs, coin] });
            }
        },
    };
});

export { useTradeDataStore };
