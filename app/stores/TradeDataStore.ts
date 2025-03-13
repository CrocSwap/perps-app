import { use } from 'react';
import {create} from 'zustand';
import { setLS } from '~/utils/AppUtils';
import { NumFormatTypes } from '~/utils/Constants';
import type { NumFormat } from '~/utils/Constants';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import { useUserOrderStore } from './UserOrderStore';



interface TradeDataStore {
    symbol: string;
    setSymbol: (symbol: string) => void;
    symbolInfo: SymbolInfoIF | null;
    setSymbolInfo: (symbolInfo: SymbolInfoIF) => void;
    favs: string[];
    setFavs: (favs:string[]) => void;
    addToFavs: (coin: string) => void;
} 
 const useTradeDataStore = create<TradeDataStore>((set, get) => ({
    symbol: '',
    setSymbol: (symbol: string) => {
        setLS('activeCoin', symbol);
        set({ symbol });
    },
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



useTradeDataStore.subscribe(async (state) => {
    const symbol = state.symbol;
    const {userOrders, setUserSymbolOrders} = useUserOrderStore();
    const filteredOrders = userOrders.filter(order => order.coin === symbol);
    setUserSymbolOrders(filteredOrders);
})


export default useTradeDataStore;