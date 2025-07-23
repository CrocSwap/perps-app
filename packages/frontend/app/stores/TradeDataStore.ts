import type { MarginBucketInfo } from '@crocswap-libs/ambient-ember';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TransactionData } from '~/components/Trade/DepositsWithdrawalsTable/DepositsWithdrawalsTableRow';
import { setLS } from '~/utils/AppUtils';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import {
    createUserTradesSlice,
    type UserTradeDataStore,
} from './UserTradeDataStore';

export type marginModesT = 'cross' | 'isolated';

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
    marginBucket: MarginBucketInfo | null;
    setMarginBucket: (marginBucket: MarginBucketInfo | null) => void;
    isTradeInfoExpanded: boolean;
    setIsTradeInfoExpanded: (shouldExpand: boolean) => void;
};

const useTradeDataStore = create<TradeDataStore>()(
    persist(
        (set, get) => ({
            ...createUserTradesSlice(set, get),
            marginMode: 'cross',
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
            selectedTradeTab: 'Positions',
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
        }),
        {
            name: 'TRADE_DATA',
            partialize: (state) => ({
                marginMode: state.marginMode,
                favKeys: state.favKeys,
                symbol: state.symbol,
                selectedTradeTab:
                    state.selectedTradeTab === 'Balances'
                        ? 'Positions'
                        : state.selectedTradeTab,
                userNonFundingLedgerUpdates: state.userNonFundingLedgerUpdates,
                isTradeInfoExpanded: state.isTradeInfoExpanded,
            }),
        },
    ),
);

export { useTradeDataStore };
