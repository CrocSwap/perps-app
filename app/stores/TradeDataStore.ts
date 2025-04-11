import { create } from 'zustand';
import { setLS } from '~/utils/AppUtils';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import { createUserTradesSlice, type UserTradeStore } from './UserOrderStore';
import { persist } from 'zustand/middleware';

type TradeDataStore = UserTradeStore & {
    symbol: string;
    setSymbol: (symbol: string) => void;
    symbolInfo: SymbolInfoIF | null;
    setSymbolInfo: (symbolInfo: SymbolInfoIF) => void;
    favKeys: string[];
    setFavKeys: (favs: string[]) => void;
    addToFavKeys: (coin: string) => void;
    favCoins: SymbolInfoIF[];
    setFavCoins: (favs: SymbolInfoIF[]) => void;
    coins: SymbolInfoIF[];
    setCoins: (coins: SymbolInfoIF[]) => void;
    removeFromFavKeys: (coin: string) => void;
    obChosenPrice: number;
    setObChosenPrice: (price: number) => void;
    obChosenAmount: number;
    setObChosenAmount: (amount: number) => void;
};

const useTradeDataStore = create<TradeDataStore>()(
    persist(
        (set, get) => ({
            ...createUserTradesSlice(set, get),
            symbol: '',
            setSymbol: (symbol: string) => {
                setLS('activeCoin', symbol);
                set({ symbol });
                get().setUserSymbolOrders(
                    get().userOrders.filter((e) => e.coin === symbol),
                );
                set({ obChosenPrice: 0, obChosenAmount: 0 });
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
            favKeys: ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'LINK'],
            setFavKeys: (favs: string[]) => set({ favKeys: favs }),
            addToFavKeys: (coin: string) => {
                if (get().favKeys.filter((e: string) => e == coin).length === 0) {
                    set({ favKeys: [...get().favKeys, coin] });
                    set({
                        favCoins: [
                            ...get().favCoins,
                            get().coins.find(
                                (e: SymbolInfoIF) => e.coin == coin,
                            ) as SymbolInfoIF,
                        ],
                    });
                }
            },
            removeFromFavKeys: (coin: string) => {
                set({ favKeys: get().favKeys.filter((e) => e != coin) });
                set({ favCoins: get().favCoins.filter((e) => e.coin != coin) });
            },
            favCoins: [],
            setFavCoins: (favs: SymbolInfoIF[]) => set({ favCoins: favs }),
            coins: [],
            setCoins: (coins: SymbolInfoIF[]) => set({ coins }),
            obChosenPrice: 0,
            setObChosenPrice: (price: number) => set({ obChosenPrice: price }),
            obChosenAmount: 0,
            setObChosenAmount: (amount: number) =>
                set({ obChosenAmount: amount }),
        }),
        {
            name: 'TRADE_DATA',
            partialize: (state) => ({
                favKeys: state.favKeys,
            }),
        },
    ),
);

export { useTradeDataStore };
