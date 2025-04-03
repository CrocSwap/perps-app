import { OrderHistoryLimits } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';

export interface UserTradeStore {
    userOrders: OrderDataIF[];
    userSymbolOrders: OrderDataIF[];
    setUserOrders: (userOrders: OrderDataIF[]) => void;
    setUserSymbolOrders: (userSymbolOrders: OrderDataIF[]) => void;
    orderHistory: OrderDataIF[];
    addOrderToHistory: (orderHistory: OrderDataIF[]) => void;
    setOrderHistory: (orderHistory: OrderDataIF[]) => void;
    filterOrderHistory: (orderHistory: OrderDataIF[], filterType?: string) => OrderDataIF[];
    userSymbolOrderHistory: OrderDataIF[];
    setUserSymbolOrderHistory: (userSymbolOrderHistory: OrderDataIF[]) => void;
}

export const createUserTradesSlice = (set:any, get:any) => ({
    userOrders: [],
    userSymbolOrders: [],
    setUserOrders: (userOrders: OrderDataIF[]) => {
        set({ userOrders })
        get().setUserSymbolOrders(userOrders.filter(e=> e.coin === get().symbol))
    },
    setUserSymbolOrders: (userSymbolOrders: OrderDataIF[]) => {
        set({ userSymbolOrders })
    },
    orderHistory: [],
    addOrderToHistory: (newOrders: OrderDataIF[]) => {
        const newOrderHistory = [...newOrders, ...get().orderHistory].slice(0, OrderHistoryLimits.MAX);
        newOrderHistory.sort((a, b) => b.timestamp - a.timestamp);
        set({userSymbolOrderHistory: [...newOrderHistory.filter(e=> e.coin === get().symbol), 
            ...get().userSymbolOrderHistory].slice(0, OrderHistoryLimits.RENDERED)})
        set({ orderHistory: newOrderHistory })
    },
    setOrderHistory: (orderHistory: OrderDataIF[]) => {
        set({ orderHistory })
        set({ userSymbolOrderHistory: orderHistory.filter(e=> e.coin === get().symbol).slice(0, OrderHistoryLimits.RENDERED) })
    },
    filterOrderHistory: (orderHistory: OrderDataIF[], filterType?: string) => {
        if(!filterType){
            return orderHistory.slice(0, OrderHistoryLimits.RENDERED);
        }
        switch(filterType){
            case 'all':
                return orderHistory.slice(0, OrderHistoryLimits.RENDERED);
            case 'active':
                return get().userSymbolOrderHistory.slice(0, OrderHistoryLimits.RENDERED);
            case 'long':
                return orderHistory.filter(e=> e.side === 'buy').slice(0, OrderHistoryLimits.RENDERED);
            case 'short':
                return orderHistory.filter(e=> e.side === 'sell').slice(0, OrderHistoryLimits.RENDERED);
        }
    }
});

