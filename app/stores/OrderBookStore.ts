import {create} from 'zustand';
import type { OrderBookTradeIF, OrderRowIF } from '~/utils/orderbook/OrderBookIFs';

interface OrderBookStore {
    buys: OrderRowIF[];
    sells: OrderRowIF[];
    orderBook: OrderRowIF[];
    setOrderBook: (buys: OrderRowIF[], sells: OrderRowIF[]) => void;
    trades: OrderBookTradeIF[];
    setTrades: (trades: OrderBookTradeIF[]) => void;
}

export const useOrderBookStore = create<OrderBookStore>((set) => ({
    orderBook: [],
    buys: [],
    sells: [],
    trades: [],
    setOrderBook: (buys: OrderRowIF[], sells: OrderRowIF[]) => set({ buys, sells }),
    setTrades: (trades: OrderBookTradeIF[]) => set({ trades })
}));