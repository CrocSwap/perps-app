import { OrderHistoryLimits, TradeHistoryLimits } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/position/PositionIFs';
import type {
    AccountOverviewIF,
    ActiveTwapIF,
    TwapHistoryIF,
    TwapSliceFillIF,
    UserBalanceIF,
    UserFillIF,
} from '~/utils/UserDataIFs';

export interface UserTradeDataStore {
    userOrders: OrderDataIF[];
    userSymbolOrders: OrderDataIF[];
    setUserOrders: (userOrders: OrderDataIF[]) => void;
    setUserSymbolOrders: (userSymbolOrders: OrderDataIF[]) => void;
    orderHistory: OrderDataIF[];
    setOrderHistory: (orderHistory: OrderDataIF[]) => void;
    filterOrderHistory: (
        orderHistory: OrderDataIF[],
        filterType?: string,
    ) => OrderDataIF[];
    userSymbolOrderHistory: OrderDataIF[];
    setUserSymbolOrderHistory: (userSymbolOrderHistory: OrderDataIF[]) => void;
    positions: PositionIF[];
    setPositions: (positions: PositionIF[]) => void;
    userBalances: UserBalanceIF[];
    setUserBalances: (userBalances: UserBalanceIF[]) => void;
    accountOverview: AccountOverviewIF;
    setAccountOverview: (accountOverview: AccountOverviewIF) => void;
    userFills: UserFillIF[];
    setUserFills: (userFills: UserFillIF[]) => void;
    twapHistory: TwapHistoryIF[];
    setTwapHistory: (twapHistory: TwapHistoryIF[]) => void;
    twapSliceFills: TwapSliceFillIF[];
    setTwapSliceFills: (twapSliceFills: TwapSliceFillIF[]) => void;
    activeTwaps: ActiveTwapIF[];
    setActiveTwaps: (activeTwaps: ActiveTwapIF[]) => void;
}

export const createUserTradesSlice = (set: any, get: any) => ({
    userOrders: [],
    userSymbolOrders: [],
    setUserOrders: (userOrders: OrderDataIF[]) => {
        set({ userOrders: userOrders });
        get().setUserSymbolOrders(
            userOrders.filter((e) => e.coin === get().symbol),
        );
    },
    setUserSymbolOrders: (userSymbolOrders: OrderDataIF[]) => {
        set({ userSymbolOrders });
    },
    orderHistory: [],
    setOrderHistory: (orderHistory: OrderDataIF[]) => {
        const sliced = orderHistory.slice(0, OrderHistoryLimits.MAX);
        set({ orderHistory: sliced });
        set({
            userSymbolOrderHistory: sliced.filter(
                (e) => e.coin === get().symbol,
            ),
        });
    },
    filterOrderHistory: (orderHistory: OrderDataIF[], filterType?: string) => {
        if (!filterType) {
            return orderHistory;
        }
        switch (filterType) {
            case 'all':
                return orderHistory;
            case 'active':
                return get().userSymbolOrderHistory;
            case 'long':
                return orderHistory.filter((e) => e.side === 'buy');
            case 'short':
                return orderHistory.filter((e) => e.side === 'sell');
        }
    },
    positions: [],
    setPositions: (positions: PositionIF[]) => {
        set({ positions });
    },
    userSymbolOrderHistory: [],
    setUserSymbolOrderHistory: (userSymbolOrderHistory: OrderDataIF[]) =>
        set({ userSymbolOrderHistory }),
    userBalances: [],
    setUserBalances: (userBalances: UserBalanceIF[]) => {
        set({ userBalances });
    },
    accountOverview: {
        balance: 0,
        unrealizedPnl: 0,
        crossMarginRatio: 0,
        maintainanceMargin: 0,
        crossAccountLeverage: 0,
    },
    setAccountOverview: (accountOverview: AccountOverviewIF) => {
        set({ accountOverview });
    },
    userFills: [],
    setUserFills: (userFills: UserFillIF[]) => {
        const sliced = userFills.slice(0, TradeHistoryLimits.MAX);
        set({ userFills: sliced });
    },
    twapHistory: [],
    setTwapHistory: (twapHistory: TwapHistoryIF[]) => {
        set({ twapHistory });
    },
    twapSliceFills: [],
    setTwapSliceFills: (twapSliceFills: TwapSliceFillIF[]) => {
        set({ twapSliceFills });
    },
    activeTwaps: [],
    setActiveTwaps: (activeTwaps: ActiveTwapIF[]) => {
        set({ activeTwaps });
    },
});
