import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TransactionData } from '~/components/Trade/DepositsWithdrawalsTable/DepositsWithdrawalsTableRow';
import { setLS } from '~/utils/AppUtils';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { SymbolInfoIF, TokenDetailsIF } from '~/utils/SymbolInfoIFs';
import {
    createUserTradesSlice,
    type UserTradeDataStore,
} from './UserTradeDataStore';
import type { OrderInputValue, OrderSide } from '~/utils/CommonIFs';

export type marginModesT = 'margin.cross.title' | 'margin.isolated.title';

type TradeDataStore = UserTradeDataStore & {
    marginMode: marginModesT;
    setMarginMode: (m: marginModesT) => void;
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
    coinPriceMap: Map<string, number>;
    setCoinPriceMap: (coinPriceMap: Map<string, number>) => void;
    removeFromFavKeys: (coin: string) => void;
    obChosenPrice: number;
    setObChosenPrice: (price: number) => void;
    obChosenAmount: number;
    setObChosenAmount: (amount: number) => void;
    selectedCurrency: string;
    setSelectedCurrency: (currency: string) => void;
    selectedTradeTab: string;
    setSelectedTradeTab: (tab: string) => void;
    fetchedChannels: Set<string>;
    setFetchedChannels: (channels: Set<string>) => void;
    userNonFundingLedgerUpdates: TransactionData[];
    setUserNonFundingLedgerUpdates: (updates: TransactionData[]) => void;
    isTradeInfoExpanded: boolean;
    setIsTradeInfoExpanded: (shouldExpand: boolean) => void;
    updateSymbolInfo: (symbolInfo: TokenDetailsIF) => void; // used for updating symbol info from REST API while ws is sleeping
    addToFetchedChannels: (channel: string) => void;
    orderInputPriceValue: OrderInputValue;
    setOrderInputPriceValue: (value: OrderInputValue) => void;
    tradeDirection: OrderSide;
    setTradeDirection: (direction: OrderSide) => void;
    marketOrderType: string;
    setMarketOrderType: (marketOrderType: string) => void;
    setIsMidModeActive: (isActive: boolean) => void;
    isMidModeActive: boolean;
    isPreviewOrderHovered: boolean;
    setIsPreviewOrderHovered: (isHovered: boolean) => void;
};

const useTradeDataStore = create<TradeDataStore>()(
    persist(
        (set, get) => ({
            ...createUserTradesSlice(set, get),
            marginMode: 'margin.cross.title',
            setMarginMode: (m: marginModesT) => set({ marginMode: m }),
            symbol: 'BTC',
            setSymbol: (symbol: string) => {
                setLS('activeCoin', symbol);
                set({ symbol });
                get().setUserSymbolOrders(
                    get().userOrders.filter(
                        (e: OrderDataIF) => e.coin === symbol,
                    ),
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
            // favKeys: ['BTC'],
            favKeys: ['BTC', 'ETH', 'SOL'],
            setFavKeys: (favs: string[]) => set({ favKeys: favs }),
            addToFavKeys: (coin: string) => {
                if (
                    get().favKeys.filter((e: string) => e == coin).length === 0
                ) {
                    set({ favKeys: [coin, ...get().favKeys] });
                    set({
                        favCoins: [
                            get().coins.find(
                                (e: SymbolInfoIF) => e.coin == coin,
                            ) as SymbolInfoIF,
                            ...get().favCoins,
                        ],
                    });
                }
            },
            removeFromFavKeys: (coin: string) => {
                set({
                    favKeys: get().favKeys.filter((e: string) => e != coin),
                });
                set({
                    favCoins: get().favCoins.filter(
                        (e: SymbolInfoIF) => e.coin != coin,
                    ),
                });
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
            coinPriceMap: new Map(),
            setCoinPriceMap: (coinPriceMap: Map<string, number>) =>
                set({ coinPriceMap }),
            selectedCurrency: 'USD',
            setSelectedCurrency: (currency: string) =>
                set({ selectedCurrency: currency }),
            selectedTradeTab: 'common.positions',
            setSelectedTradeTab: (tab: string) => {
                set({ selectedTradeTab: tab });
            },
            fetchedChannels: new Set(),
            setFetchedChannels: (channels: Set<string>) =>
                set({ fetchedChannels: channels }),
            userNonFundingLedgerUpdates: [],
            setUserNonFundingLedgerUpdates: (updates: TransactionData[]) =>
                set({ userNonFundingLedgerUpdates: updates }),
            isTradeInfoExpanded: false,
            setIsTradeInfoExpanded: (shouldExpand: boolean) =>
                set({ isTradeInfoExpanded: shouldExpand }),
            updateSymbolInfo: (tokenDetails: TokenDetailsIF) => {
                const currentSymbolInfo = get().symbolInfo;
                if (
                    tokenDetails.name === currentSymbolInfo?.coin ||
                    (tokenDetails.name === 'UBTC' &&
                        currentSymbolInfo?.coin === 'BTC')
                ) {
                    currentSymbolInfo.markPx = tokenDetails.markPx;
                    currentSymbolInfo.lastPriceChange =
                        tokenDetails.markPx - currentSymbolInfo.markPx;
                    set({ symbolInfo: currentSymbolInfo });
                }
            },
            addToFetchedChannels: (channel: string) => {
                get().fetchedChannels.add(channel);
            },
            orderInputPriceValue: { value: 0, changeType: 'inputChange' },
            setOrderInputPriceValue: (value: OrderInputValue) =>
                set({ orderInputPriceValue: value }),
            tradeDirection: 'buy',
            setTradeDirection: (direction: OrderSide) =>
                set({ tradeDirection: direction }),
            marketOrderType: 'market',
            setMarketOrderType: (marketOrderType: string) =>
                set({ marketOrderType }),
            setIsMidModeActive: (isActive: boolean) =>
                set({ isMidModeActive: isActive }),
            isMidModeActive: true,
            isPreviewOrderHovered: false,
            setIsPreviewOrderHovered: (isHovered: boolean) =>
                set({ isPreviewOrderHovered: isHovered }),
        }),
        {
            name: 'TRADE_DATA',
            version: 3, // Bump version for migration!
            migrate: (persistedState: unknown, version: number) => {
                if (version < 1) {
                    const currentFavKeys =
                        (persistedState as TradeDataStore).favKeys ?? [];
                    const mustHave = ['ETH', 'SOL'];

                    for (const coin of mustHave) {
                        if (!currentFavKeys.includes(coin)) {
                            currentFavKeys.push(coin);
                        }
                    }

                    return {
                        ...(persistedState as TradeDataStore),
                        favKeys: currentFavKeys,
                    };
                }
                if (version < 3) {
                    return {
                        ...(persistedState as TradeDataStore),
                        selectedTradeTab: 'common.positions',
                        marginMode: 'margin.cross.title',
                    };
                }
                return persistedState ?? {};
            },
            partialize: (state) => ({
                marginMode: state.marginMode,
                favKeys: state.favKeys,
                symbol: state.symbol,
                selectedTradeTab:
                    state.selectedTradeTab === 'common.balances'
                        ? 'common.positions'
                        : state.selectedTradeTab,
                userNonFundingLedgerUpdates: state.userNonFundingLedgerUpdates,
                isTradeInfoExpanded: state.isTradeInfoExpanded,
            }),
        },
    ),
);

export { useTradeDataStore };
