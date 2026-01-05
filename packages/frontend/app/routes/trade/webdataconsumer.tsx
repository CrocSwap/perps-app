/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import type { UserFillsData } from '@perps-app/sdk/src/utils/types';
import { t } from 'i18next';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { TransactionData } from '~/components/Trade/DepositsWithdrawalsTable/DepositsWithdrawalsTableRow';
import { useMarketOrderLog } from '~/hooks/useMarketOrderLog';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useSdk } from '~/hooks/useSdk';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { useWorker } from '~/hooks/useWorker';
import type { WebData2Output } from '~/hooks/workers/webdata2.worker';
import { processUserOrder } from '~/processors/processOrderBook';
import {
    processUserFills,
    processUserFundings,
    processUserTwapHistory,
    processUserTwapSliceFills,
} from '~/processors/processUserFills';
import { useDebugStore } from '~/stores/DebugStore';
import { useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUnifiedMarginStore } from '~/stores/UnifiedMarginStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import {
    OrderHistoryLimits,
    TradeHistoryLimits,
    WsChannels,
} from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/position/PositionIFs';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import type {
    AccountOverviewIF,
    ActiveTwapIF,
    TwapHistoryIF,
    TwapSliceFillIF,
    UserBalanceIF,
    UserFillIF,
    UserFundingIF,
} from '~/utils/UserDataIFs';

export default function WebDataConsumer() {
    const { debugWallet, isDebugWalletActive } = useDebugStore();

    const DUMMY_ADDRESS = useMemo(() => {
        if (isDebugWalletActive) {
            return debugWallet.address;
        }
        return '0x0000000000000000000000000000000000000000';
    }, [isDebugWalletActive, debugWallet]);

    const {
        favKeys,
        setFavCoins,
        setUserOrders,
        symbol,
        symbolInfo,
        setSymbolInfo,
        coins,
        setPositions,
        setUserBalances,
        setAccountOverview,
        accountOverview,
        setOrderHistory,
        setFetchedChannels,
        setUserSymbolOrders,
        setUserFills,
        setTwapHistory,
        setTwapSliceFills,
        setUserFundings,
        setActiveTwaps,
        setUserNonFundingLedgerUpdates,
    } = useTradeDataStore();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;
    const favKeysRef = useRef<string[]>(null);
    favKeysRef.current = favKeys;

    const sessionState = useSession();

    const { userAddress } = useUserDataStore();
    const addressRef = useRef<string>(null);
    // Always use lowercase for comparison
    addressRef.current = userAddress?.toLowerCase();

    // Use unified margin data for both balance and positions
    const { positions: unifiedPositions } = useUnifiedMarginData();

    // Initialize market order log pre-fetching
    useMarketOrderLog();

    const { setPositions: setUnifiedPositions, setBalance: setUnifiedBalance } =
        useUnifiedMarginStore();

    const openOrdersRef = useRef<OrderDataIF[]>([]);
    const positionsRef = useRef<PositionIF[]>([]);
    const userBalancesRef = useRef<UserBalanceIF[]>([]);
    const userOrderHistoryRef = useRef<OrderDataIF[]>([]);
    const userFillsRef = useRef<UserFillIF[]>([]);
    const twapHistoryRef = useRef<TwapHistoryIF[]>([]);
    const twapSliceFillsRef = useRef<TwapSliceFillIF[]>([]);
    const userFundingsRef = useRef<UserFundingIF[]>([]);
    const activeTwapsRef = useRef<ActiveTwapIF[]>([]);
    const userNonFundingLedgerUpdatesRef = useRef<TransactionData[]>([]);
    const notificationStore = useNotificationStore();
    const { formatNum } = useNumFormatter();

    const { info } = useSdk();
    const accountOverviewRef = useRef<AccountOverviewIF | null>(null);

    const acccountOverviewPrevRef = useRef<AccountOverviewIF | null>(null);
    const fetchedChannelsRef = useRef<Set<string>>(new Set());

    const notifiedOrdersRef = useRef<Set<number>>(new Set());

    const debugWalletActiveRef = useRef<boolean>(false);
    debugWalletActiveRef.current = isDebugWalletActive;

    useEffect(() => {
        const foundCoin = coins.find((coin) => coin.coin === symbol);
        if (foundCoin) {
            setSymbolInfo(foundCoin);
        }
    }, [symbol, coins]);

    // Add a periodic check to ensure symbolInfo stays updated
    useEffect(() => {
        const updateInterval = setInterval(() => {
            const foundCoin = coins.find((coin) => coin.coin === symbol);
            if (foundCoin && symbolInfo) {
                // Only update if data has actually changed to avoid unnecessary re-renders
                if (
                    foundCoin.markPx !== symbolInfo.markPx ||
                    foundCoin.oraclePx !== symbolInfo.oraclePx ||
                    foundCoin.dayNtlVlm !== symbolInfo.dayNtlVlm ||
                    foundCoin.funding !== symbolInfo.funding ||
                    foundCoin.openInterest !== symbolInfo.openInterest
                ) {
                    setSymbolInfo(foundCoin);
                }
            }
        }, 1000);

        return () => clearInterval(updateInterval);
    }, [symbol, coins, symbolInfo, setSymbolInfo]);

    useEffect(() => {
        console.log('[WebDataConsumer] Subscription setup effect triggered:', {
            hasInfo: !!info,
            userAddress,
            timestamp: new Date().toISOString(),
        });
        if (!info) return;

        console.log(
            '[WebDataConsumer] CLEARING and re-establishing all subscriptions!',
        );
        setFetchedChannels(new Set());
        fetchedChannelsRef.current = new Set();
        setUserOrders([]);
        setUserSymbolOrders([]);
        // Positions are now managed by PositionsStore, not webData2
        setUserBalances([]);
        positionsRef.current = [];
        openOrdersRef.current = [];
        userFundingsRef.current = [];
        activeTwapsRef.current = [];
        setUserNonFundingLedgerUpdates([]);
        userNonFundingLedgerUpdatesRef.current = [];
        resetRefs();

        // Subscribe to webData2 on user socket for user-specific data
        console.log(
            '[WEB_DATA2] Setting up subscription with user:',
            userAddress,
        );
        const { unsubscribe } = info.subscribe(
            { type: WsChannels.WEB_DATA2, user: userAddress },
            postWebData2,
            () => {
                console.log('[WEB_DATA2] Subscription snapshot complete');
                fetchedChannelsRef.current.add(WsChannels.WEB_DATA2);
            },
        );

        // Also subscribe to webData2 on market socket for market data
        // This ensures market data comes from the market endpoint even when user endpoint is different
        let unsubscribeMarketData: (() => void) | undefined;
        if (info.multiSocketInfo && isDebugWalletActive) {
            const marketSocket = info.multiSocketInfo.getMarketSocket();
            if (marketSocket) {
                const marketDataCallback = (msg: any) => {
                    // Only process market data from this subscription
                    postWebData2MarketOnly(msg);
                };
                const result = marketSocket.subscribe(
                    { type: WsChannels.WEB_DATA2, user: DUMMY_ADDRESS },
                    marketDataCallback,
                );
                unsubscribeMarketData = result.unsubscribe;
            }
        }

        console.log('[ORDER HISTORY] Setting up subscription:', {
            user: userAddress,
            hasMultiSocket: !!info.multiSocketInfo,
            channel: WsChannels.USER_HISTORICAL_ORDERS,
        });
        const { unsubscribe: unsubscribeOrderHistory } = info.subscribe(
            {
                type: WsChannels.USER_HISTORICAL_ORDERS,
                user: userAddress,
            },
            (payload: any) => {
                console.log(
                    '[ORDER HISTORY] Message received via subscription callback',
                );
                postUserHistoricalOrders(payload);
            },
        );

        console.log(
            '[USER FILLS] Setting up subscription with user:',
            userAddress,
        );
        const { unsubscribe: unsubscribeUserFills } = info.subscribe(
            { type: WsChannels.USER_FILLS, user: userAddress },
            (payload: any) => {
                console.log(
                    '[USER FILLS] Message received via subscription callback',
                );
                postUserFills(payload);
            },
            () => {
                console.log('[USER FILLS] Subscription snapshot complete');
                fetchedChannelsRef.current.add(WsChannels.USER_FILLS);
            },
        );

        const { unsubscribe: unsubscribeUserTwapSliceFills } = info.subscribe(
            { type: WsChannels.TWAP_SLICE_FILLS, user: userAddress },
            postUserTwapSliceFills,
            () => {
                fetchedChannelsRef.current.add(WsChannels.TWAP_SLICE_FILLS);
            },
        );

        const { unsubscribe: unsubscribeUserTwapHistory } = info.subscribe(
            { type: WsChannels.TWAP_HISTORY, user: userAddress },
            postUserTwapHistory,
            () => {
                fetchedChannelsRef.current.add(WsChannels.TWAP_HISTORY);
            },
        );

        const { unsubscribe: unsubscribeUserFundings } = info.subscribe(
            { type: WsChannels.USER_FUNDINGS, user: userAddress },
            postUserFundings,
            () => {
                fetchedChannelsRef.current.add(WsChannels.USER_FUNDINGS);
            },
        );

        const { unsubscribe: unsubscribeUserNonFundingLedgerUpdates } =
            info.subscribe(
                {
                    type: WsChannels.USER_NON_FUNDING_LEDGER_UPDATES,
                    user: userAddress,
                },
                postUserNonFundingLedgerUpdates,
                () => {
                    fetchedChannelsRef.current.add(
                        WsChannels.USER_NON_FUNDING_LEDGER_UPDATES,
                    );
                },
            );

        const userDataInterval = setInterval(() => {
            // NOTE: setUserOrders and setOrderHistory removed from here
            // They are updated immediately in postUserHistoricalOrders to avoid race conditions

            // Positions now come from RPC polling, not webData2
            setUserBalances(userBalancesRef.current);
            setUserFills(userFillsRef.current);
            setTwapHistory(twapHistoryRef.current);
            setTwapSliceFills(twapSliceFillsRef.current);
            setUserFundings(userFundingsRef.current);
            setActiveTwaps(activeTwapsRef.current);
            setUserNonFundingLedgerUpdates(
                userNonFundingLedgerUpdatesRef.current,
            );

            if (acccountOverviewPrevRef.current && accountOverviewRef.current) {
                accountOverviewRef.current.balanceChange =
                    accountOverviewRef.current.balance -
                    acccountOverviewPrevRef.current.balance;
                accountOverviewRef.current.maintainanceMarginChange =
                    accountOverviewRef.current.maintainanceMargin -
                    acccountOverviewPrevRef.current.maintainanceMargin;
            }
            if (accountOverviewRef.current) {
                setAccountOverview(accountOverviewRef.current);
            }
            if (debugWalletActiveRef.current) {
                setPositions(positionsRef.current);
                setUnifiedPositions(positionsRef.current);
                setUserBalances(userBalancesRef.current);
            }
            setFetchedChannels(new Set([...fetchedChannelsRef.current]));
        }, 1000);

        return () => {
            console.log(
                '[WebDataConsumer] CLEANUP - Tearing down all subscriptions!',
                {
                    userAddress,
                    timestamp: new Date().toISOString(),
                },
            );
            clearInterval(userDataInterval);
            // clearInterval(monitorInterval);
            unsubscribe();
            unsubscribeMarketData?.();
            unsubscribeOrderHistory();
            unsubscribeUserFills();
            unsubscribeUserTwapSliceFills();
            unsubscribeUserTwapHistory();
            unsubscribeUserFundings();
            unsubscribeUserNonFundingLedgerUpdates();
        };
    }, [userAddress, info, isDebugWalletActive]);

    useEffect(() => {
        acccountOverviewPrevRef.current = accountOverview;
    }, [accountOverview]);

    const lastDataTimestampRef = useRef<number>(Date.now());

    const handleWebData2WorkerResult = useCallback(
        ({ data }: { data: WebData2Output }) => {
            // Update last data timestamp
            lastDataTimestampRef.current = Date.now();

            // When using multi-socket mode, market data comes from market socket
            // So we only process user data from the user socket's webData2
            // if (!info?.multiSocketInfo) {
            //     // Legacy mode: process all data from single socket
            //     setCoins(data.data.coins);
            //     setCoinPriceMap(data.data.coinPriceMap);
            // }

            // Process data if it matches the target address (from URL or session)
            if (data.data.user?.toLowerCase() === addressRef.current) {
                // Open orders now come from order history subscription
                // Positions now come from RPC polling
                userBalancesRef.current = data.data.userBalances;
                accountOverviewRef.current = data.data.accountOverview;
                activeTwapsRef.current = data.data.activeTwaps;
            }
            fetchedChannelsRef.current.add(WsChannels.WEB_DATA2);
            setFetchedChannels(new Set([...fetchedChannelsRef.current]));
        },
        [info?.multiSocketInfo, sessionState, setFetchedChannels],
    );

    const postWebData2 = useWorker<WebData2Output>(
        'webData2',
        handleWebData2WorkerResult,
    );

    // Handler for market-only data from market socket
    const handleWebData2MarketOnlyResult = useCallback(
        ({ data }: { data: WebData2Output }) => {
            // Update last data timestamp
            lastDataTimestampRef.current = Date.now();

            if (debugWalletActiveRef.current) {
                positionsRef.current = data.data.positions;
                userBalancesRef.current = data.data.userBalances;
            }
        },
        [],
    );

    const postWebData2MarketOnly = useWorker<WebData2Output>(
        'webData2',
        handleWebData2MarketOnlyResult,
    );

    const postUserHistoricalOrders = useCallback(
        (payload: any) => {
            const data = payload.data;

            if (!data) {
                console.warn('[ORDER HISTORY] No data in payload');
                return;
            }

            console.log('[ORDER HISTORY] Received subscription data:', {
                isSnapshot: data.isSnapshot,
                orderCount: data.orderHistory?.length,
                user: data.user,
            });

            if (
                data &&
                data.orderHistory &&
                data.user &&
                data.user?.toLowerCase() === addressRef.current?.toLowerCase()
            ) {
                const orders: OrderDataIF[] = [];
                data.orderHistory.forEach((order: any) => {
                    const processedOrder = processUserOrder(
                        order.order,
                        order.status,
                    );
                    if (processedOrder) {
                        orders.push(processedOrder);
                    }
                });

                const previousOpenOrders = [...openOrdersRef.current];

                if (data.isSnapshot) {
                    orders.sort((a, b) => b.timestamp - a.timestamp);
                    userOrderHistoryRef.current = orders;
                    // Extract open orders for the open orders table
                    const openOrders = orders.filter(
                        (order) => order.status === 'open',
                    );
                    openOrdersRef.current = openOrders;

                    console.log(
                        '[OPEN ORDERS] Snapshot - Setting open orders:',
                        {
                            totalOrders: orders.length,
                            openOrdersCount: openOrders.length,
                            openOrderOids: openOrders.map((o) => ({
                                oid: o.oid,
                                coin: o.coin,
                                status: o.status,
                            })),
                        },
                    );
                } else {
                    // For updates, merge new/updated orders with existing ones
                    // Create a map to track the latest status of each order by oid
                    const orderMap = new Map<number, OrderDataIF>();

                    // First, add all existing orders to the map
                    userOrderHistoryRef.current.forEach((order) => {
                        orderMap.set(order.oid, order);
                    });

                    // Then, update or add new orders (this will overwrite with latest status)
                    orders.forEach((order) => {
                        // const existingOrder = orderMap.get(order.oid);
                        // console.log(
                        //     '[ORDER HISTORY] Update - Order status change:',
                        //     {
                        //         oid: order.oid,
                        //         coin: order.coin,
                        //         oldStatus: existingOrder?.status,
                        //         newStatus: order.status,
                        //         isNewOrder: !existingOrder,
                        //     },
                        // );
                        orderMap.set(order.oid, order);
                    });

                    // Convert back to array and sort
                    userOrderHistoryRef.current = Array.from(orderMap.values())
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, OrderHistoryLimits.MAX);

                    // Update open orders - filter only orders with status 'open'
                    const allOpenOrders = userOrderHistoryRef.current.filter(
                        (order) => order.status === 'open',
                    );
                    openOrdersRef.current = allOpenOrders;

                    // Log changes to open orders
                    const removedOrders = previousOpenOrders.filter(
                        (prevOrder) =>
                            !allOpenOrders.find(
                                (order) => order.oid === prevOrder.oid,
                            ),
                    );
                    const addedOrders = allOpenOrders.filter(
                        (order) =>
                            !previousOpenOrders.find(
                                (prevOrder) => prevOrder.oid === order.oid,
                            ),
                    );

                    if (removedOrders.length > 0 || addedOrders.length > 0) {
                        console.log(
                            '[OPEN ORDERS] Update - Changes detected:',
                            {
                                previousCount: previousOpenOrders.length,
                                newCount: allOpenOrders.length,
                                removed: removedOrders.map((o) => ({
                                    oid: o.oid,
                                    coin: o.coin,
                                    status: o.status,
                                })),
                                added: addedOrders.map((o) => ({
                                    oid: o.oid,
                                    coin: o.coin,
                                    status: o.status,
                                })),
                            },
                        );
                    }
                }
                fetchedChannelsRef.current.add(
                    WsChannels.USER_HISTORICAL_ORDERS,
                );
                // Update store immediately for both snapshot and updates
                setOrderHistory(userOrderHistoryRef.current);
                setUserOrders(openOrdersRef.current);
                setFetchedChannels(new Set([...fetchedChannelsRef.current]));
            } else {
                console.warn(
                    '[ORDER HISTORY] Skipping - user mismatch or missing data',
                );
            }
        },
        [setFetchedChannels],
    );

    const postUserFills = useCallback(
        (payload: any) => {
            const data = payload.data as UserFillsData;

            console.log('[USER FILLS] Received subscription data:', {
                isSnapshot: data?.isSnapshot,
                fillsCount: data?.fills?.length,
                user: data?.user,
            });

            if (
                data &&
                data.user &&
                data.user?.toLowerCase() === addressRef.current?.toLowerCase()
            ) {
                console.log('[USER FILLS] Processing fills:', {
                    rawFills: data.fills?.slice(0, 3).map((fill: any) => ({
                        coin: fill.coin,
                        side: fill.side,
                        px: fill.px,
                        sz: fill.sz,
                        oid: fill.oid,
                        tid: fill.tid,
                        time: fill.time,
                        startPosition: fill.startPosition,
                        hasStartPosition: 'startPosition' in fill,
                    })),
                });

                const fills = processUserFills(data);
                fills.sort((a, b) => b.time - a.time);

                const limitFills = fills.filter(
                    (fill) => fill.crossed === true,
                );

                console.log('[USER FILLS] Processed fills:', {
                    processedCount: fills.length,
                    firstFewFills: fills.slice(0, 3).map((fill) => ({
                        coin: fill.coin,
                        side: fill.side,
                        px: fill.px,
                        sz: fill.sz,
                        oid: fill.oid,
                        tid: fill.tid,
                        time: fill.time,
                    })),
                });

                if (!data.isSnapshot) {
                    limitFills.forEach((fill) => {
                        // manage max length for notified orders
                        if (
                            Array.from(notifiedOrdersRef.current).length >= 10
                        ) {
                            notifiedOrdersRef.current.delete(
                                Array.from(notifiedOrdersRef.current)[0],
                            );
                        }

                        // Only show notification if we haven't notified for this order ID yet
                        if (!notifiedOrdersRef.current.has(fill.oid)) {
                            const usdValueOfFillStr = formatNum(
                                fill.sz * fill.px,
                                fill.px > 10_000 ? 0 : 2,
                                true,
                                true,
                            );

                            // Add to notified orders before showing notification
                            notifiedOrdersRef.current.add(fill.oid);

                            notificationStore.add({
                                title: t('transactions.orderFilled.title', {
                                    side:
                                        fill.side === 'buy' || fill.side === 'B'
                                            ? t(
                                                  'transactions.orderFilled.buySide',
                                              )
                                            : t(
                                                  'transactions.orderFilled.sellSide',
                                              ),
                                }),
                                message: t('transactions.orderFilled.message', {
                                    side:
                                        fill.side === 'buy' || fill.side === 'B'
                                            ? t(
                                                  'transactions.orderFilled.buySide',
                                              ).toLowerCase()
                                            : t(
                                                  'transactions.orderFilled.sellSide',
                                              ).toLowerCase(),
                                    usdValueOfFillStr,
                                    symbol: fill.coin,
                                    fillPrice: formatNum(
                                        fill.px,
                                        fill.px > 10_000 ? 0 : 2,
                                        true,
                                        true,
                                    ),
                                }),
                                icon: 'check',
                                removeAfter: 5000,
                            });
                        }
                    });
                }

                // Merge fills with deduplication
                const previousCount = userFillsRef.current.length;
                const joinedFills = userFillsRef.current.concat(fills);
                joinedFills.sort((a, b) => b.time - a.time);

                // Set of deduplication keys
                const dedupKeySet = new Set<string>();

                const deFupKeyFn = (fill: UserFillIF) => {
                    return fill.startPositionRaw
                        ? `${fill.coin}-${fill.oid}-${fill.startPositionRaw}`
                        : `${fill.coin}-${fill.oid}-${fill.tid}`;
                };

                const filteredFills = joinedFills.filter((fill) => {
                    const dedupeKey = deFupKeyFn(fill);
                    if (dedupKeySet.has(dedupeKey)) {
                        return false; // Duplicate found, skip this fill
                    }
                    dedupKeySet.add(dedupeKey);
                    return true; // Unique fill, keep it
                });

                console.log(
                    '[USER FILLS] Added update fills with deduplication:',
                    {
                        newFillsCount: filteredFills.length,
                        previousTotal: previousCount,
                        newTotal: userFillsRef.current.length,
                    },
                );

                userFillsRef.current = filteredFills.slice(
                    0,
                    TradeHistoryLimits.MAX,
                );
                setUserFills(userFillsRef.current);

                fetchedChannelsRef.current.add(WsChannels.USER_FILLS);
                setFetchedChannels(new Set([...fetchedChannelsRef.current]));
            } else {
                console.warn(
                    '[USER FILLS] Skipping - user mismatch or missing data',
                );
            }
        },
        [setFetchedChannels],
    );

    const postUserTwapSliceFills = useCallback((payload: any) => {
        const data = payload.data;
        if (
            data &&
            data.user &&
            data.user?.toLowerCase() === addressRef.current?.toLowerCase()
        ) {
            const fills = processUserTwapSliceFills(data);
            if (data.isSnapshot) {
                twapSliceFillsRef.current = fills;
            } else {
                twapSliceFillsRef.current = [
                    ...fills,
                    ...twapSliceFillsRef.current,
                ].slice(0, TradeHistoryLimits.MAX);
            }
            fetchedChannelsRef.current.add(WsChannels.TWAP_SLICE_FILLS);
        }
    }, []);

    const postUserTwapHistory = useCallback((payload: any) => {
        const data = payload.data;
        if (
            data &&
            data.user &&
            data.user?.toLowerCase() === addressRef.current?.toLowerCase()
        ) {
            const history = processUserTwapHistory(data);
            if (data.isSnapshot) {
                twapHistoryRef.current = history;
            } else {
                twapHistoryRef.current = [
                    ...history,
                    ...twapHistoryRef.current,
                ].slice(0, TradeHistoryLimits.MAX);
            }
            fetchedChannelsRef.current.add(WsChannels.TWAP_HISTORY);
        }
    }, []);

    const postUserFundings = useCallback(
        (payload: any) => {
            const data = payload.data;
            if (
                data &&
                data.user &&
                data.user?.toLowerCase() === addressRef.current?.toLowerCase()
            ) {
                const fundings = processUserFundings(data.fundings);
                fundings.sort((a, b) => b.time - a.time);
                if (data.isSnapshot) {
                    userFundingsRef.current = fundings;
                } else {
                    userFundingsRef.current = [
                        ...fundings,
                        ...userFundingsRef.current,
                    ].slice(0, TradeHistoryLimits.MAX);
                }
                fetchedChannelsRef.current.add(WsChannels.USER_FUNDINGS);
                setFetchedChannels(new Set([...fetchedChannelsRef.current]));
            }
        },
        [setFetchedChannels],
    );

    const postUserNonFundingLedgerUpdates = useCallback(
        (payload: any) => {
            const data = payload.data;
            if (
                data &&
                data.user &&
                data.user.toLowerCase() === addressRef.current?.toLowerCase()
            ) {
                if (data.isSnapshot) {
                    userNonFundingLedgerUpdatesRef.current =
                        data.nonFundingLedgerUpdates || [];
                } else {
                    userNonFundingLedgerUpdatesRef.current = [
                        ...(data.nonFundingLedgerUpdates || []),
                        ...userNonFundingLedgerUpdatesRef.current,
                    ].slice(0, TradeHistoryLimits.MAX);
                }
                setUserNonFundingLedgerUpdates(
                    userNonFundingLedgerUpdatesRef.current,
                );
                fetchedChannelsRef.current.add('userNonFundingLedgerUpdates');
            }
        },
        [setUserNonFundingLedgerUpdates],
    );

    useEffect(() => {
        if (favKeysRef.current && coins.length > 0) {
            const favs: SymbolInfoIF[] = [];
            favKeysRef.current.forEach((coin) => {
                const c = coins.find((c) => c.coin === coin);
                if (c) {
                    favs.push(c);
                }
            });
            setFavCoins(favs);
        }
    }, [favKeys, coins]);

    const resetRefs = useCallback(() => {
        openOrdersRef.current = [];
        positionsRef.current = [];
        userBalancesRef.current = [];
        userOrderHistoryRef.current = [];
        userFillsRef.current = [];
        twapHistoryRef.current = [];
        twapSliceFillsRef.current = [];
        userFundingsRef.current = [];
        activeTwapsRef.current = [];
        userNonFundingLedgerUpdatesRef.current = [];
        notifiedOrdersRef.current = new Set();
    }, []);

    useEffect(() => {
        if (!isEstablished(sessionState)) {
            resetRefs();
        }
    }, [isEstablished(sessionState)]);

    // Update positions in TradeDataStore when unified data changes
    useEffect(() => {
        if (unifiedPositions && !debugWalletActiveRef.current) {
            setPositions(unifiedPositions);
        }
    }, [unifiedPositions, setPositions]);

    return <></>;
}
