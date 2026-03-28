import { motion } from 'framer-motion';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import BasicDivider from '~/components/Dividers/BasicDivider';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useRestPoller } from '~/hooks/useRestPoller';
// import { useWorker } from '~/hooks/useWorker';
// import type { OrderBookOutput } from '~/hooks/workers/orderbook.worker';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
import { TableState } from '~/utils/CommonIFs';
import type {
    OrderBookMode,
    OrderBookRowIF,
    OrderDataIF,
    OrderRowResolutionIF,
} from '~/utils/orderbook/OrderBookIFs';
import {
    getPrecisionForResolution,
    getResolutionListForSymbol,
} from '~/utils/orderbook/OrderBookUtils';
import styles from './orderbook.module.css';
import OrderRow, { OrderRowClickTypes } from './orderrow/orderrow';
// import { TIMEOUT_OB_POLLING } from '~/utils/Constants';
import type { TabType } from '~/routes/trade';
// import { useSdk } from '~/hooks/useSdk';
import { t } from 'i18next';
import type { L2BookData } from '@perps-app/sdk/src/utils/types';
import { processOrderBookMessage } from '~/processors/processOrderBook';
import { useWs, type WsSubscriptionConfig } from '~/contexts/WsContext';
import { useMobile } from '~/hooks/useMediaQuery';

interface OrderBookProps {
    orderCount: number;
    heightOverride?: string;
    switchTab?: (tab: TabType) => void;
}

interface ObFocusedSlot {
    price: number;
    side: 'buy' | 'sell';
}

const dummyOrder: OrderBookRowIF = {
    coin: 'BTC',
    px: 10000,
    sz: 1,
    type: 'buy',
    ratio: 0.5,
    n: 0,
    total: 0,
};

// Custom hook to memoize slot arrays
function useOrderSlots(orders: OrderBookRowIF[]) {
    return useMemo(() => orders?.map((order) => order.px), [orders]);
}

const OrderBook: React.FC<OrderBookProps> = ({
    orderCount,
    heightOverride,
    switchTab,
}) => {
    // TODO: Can be uncommented if we want to use the rest poller
    // const { subscribeToPoller, unsubscribeFromPoller } = useRestPoller();

    const { subscribe, unsubscribe, forceReconnect } = useWs();

    const isMobile = useMobile();

    const orderClickDisabled = false;
    const forceReconnectInterval = useRef<ReturnType<
        typeof setInterval
    > | null>(null);
    const lastMessageTimeRef = useRef<number>(Date.now());

    const [orderRowHeight, setOrderRowHeight] = useState<number>(16);
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const dummyOrderRow = document.getElementById('dummyOrderRow');
        const h = dummyOrderRow?.getBoundingClientRect()?.height;
        if (h && Number.isFinite(h)) setOrderRowHeight(h);
    }, []);

    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);

    const [wsError, setWsError] = useState<string | null>(null);

    const filledResolution = useRef<OrderRowResolutionIF | null>(null);
    const { formatNum } = useNumFormatter();
    const lockOrderBook = useRef<boolean>(false);
    const { getBsColor } = useAppSettings();
    const {
        buys,
        sells,
        selectedResolution,
        selectedMode,
        orderBookState,
        setOrderBook,
        setSelectedResolution,
        setSelectedMode,
        setOrderBookState,
        addToResolutionPair,
        resolutionPairs,
        midPrice,
        setMidPrice,
        setUsualResolution,
        setObMaxSell,
        setObMinBuy,
        setObMaxBuy,
        setObMinSell,
    } = useOrderBookStore();
    const midPriceRef = useRef<number | null>(null);
    midPriceRef.current = midPrice;
    const [lwBuys, setLwBuys] = useState<OrderBookRowIF[]>([]);
    const [lwSells, setLwSells] = useState<OrderBookRowIF[]>([]);

    const [focusedSlot, setFocusedSlot] = useState<ObFocusedSlot | null>(null);
    const [focusedSlotOutOfBounds, setFocusedSlotOutOfBounds] = useState<
        'buy' | 'sell' | null
    >(null);

    const rowLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const { subscribeToPoller, unsubscribeFromPoller } = useRestPoller();

    // No useMemo for simple arithmetic
    const buyPlaceHolderCount = Math.max(orderCount - buys?.length || 0, 0);
    const sellPlaceHolderCount = Math.max(orderCount - sells?.length || 0, 0);

    const selectedResolutionRef = useRef(selectedResolution);
    selectedResolutionRef.current = selectedResolution;

    // useEffect(() => {
    //     console.log('buys', buys);
    //     console.log('sells', sells);
    //     console.log('orderBook');
    // }, [buys, sells]);

    const {
        userOrders,
        userSymbolOrders,
        symbolInfo,
        setObChosenPrice,
        setObChosenAmount,
        symbol,
        orderInputPriceValue,
        tradeDirection,
        isMidModeActive,
    } = useTradeDataStore();
    const userOrdersRef = useRef<OrderDataIF[]>([]);

    const { obPreviewLine } = useChartLinesStore();

    const needExtraPolling = useMemo(() => {
        if (!selectedResolution || !resolutions.length) return false;
        if (selectedResolution.mantissa) return true;
        const lowestResolution = resolutions[0];
        return !(
            lowestResolution.nsigfigs === selectedResolution.nsigfigs &&
            lowestResolution.val === selectedResolution.val
        );
    }, [selectedResolution, symbol, resolutions]);

    const needExtraPollingRef = useRef(needExtraPolling);
    needExtraPollingRef.current = needExtraPolling;

    const foundClosestSlotForFocusedPriceRef = useRef(false);

    useEffect(() => {
        return () => {
            if (forceReconnectInterval.current) {
                clearInterval(forceReconnectInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        const subKey = {
            type: 'l2Book' as const,
            coin: symbol,
        };

        if (needExtraPolling) {
            subscribeToPoller(
                'info',
                subKey,
                (l2BookData: L2BookData) => {
                    const { buys, sells } = processOrderBookMessage(l2BookData);
                    setLwBuys(buys);
                    setLwSells(sells);
                    setMidPrice((buys[0].px + sells[0].px) / 2);
                },
                3000,
                true,
            );
        }

        return () => {
            unsubscribeFromPoller('info', subKey);
        };
    }, [needExtraPolling]);

    useEffect(() => {
        if (
            needExtraPollingRef.current &&
            symbolInfo?.markPx &&
            !midPriceRef.current
        ) {
            setMidPrice(symbolInfo.markPx);
        }
    }, [symbolInfo?.markPx]);

    // Use custom hook for stable slot arrays
    const buySlots = useOrderSlots(buys);
    const sellSlots = useOrderSlots(sells);

    const orderCountRef = useRef<number>(0);
    orderCountRef.current = orderCount;

    const findClosestSlot = useCallback(
        (orderPriceRounded: number, slots: number[], gapTreshold: number) => {
            let closestSlot = null;
            for (const slot of slots) {
                if (Math.abs(slot - orderPriceRounded) <= gapTreshold) {
                    closestSlot = slot;
                    break;
                }
            }
            return closestSlot;
        },
        [],
    );

    const findClosestByFlooring = useCallback(
        (orderPriceRounded: number, slots: number[]) => {
            if (!filledResolution.current) return null;
            const resolutionValue = filledResolution.current.val;

            const floored =
                orderPriceRounded - (orderPriceRounded % resolutionValue);

            let closestSlot = null;
            for (const slot of slots) {
                if (slot === floored) {
                    closestSlot = slot;
                    break;
                }
            }
            return closestSlot;
        },
        [],
    );

    useEffect(() => {
        if (userOrdersRef.current.length === 0) {
            userOrdersRef.current = userOrders;
        }
    }, [userOrders]);

    // Memoize userBuySlots and userSellSlots with stable dependencies
    const userBuySlots: Set<string> = useMemo(() => {
        if (!filledResolution.current) return new Set<string>();
        const precision = getPrecisionForResolution(filledResolution.current);
        const gapTreshold = filledResolution.current.val / 2;
        const slots = new Set<string>();
        const buyOrders = userSymbolOrders.filter(
            (order) => order.side === 'buy',
        );

        for (const order of buyOrders) {
            const orderPriceRounded = Number(
                Number(order.limitPx).toFixed(precision),
            );
            let closestSlot = findClosestSlot(
                orderPriceRounded,
                buySlots,
                gapTreshold,
            );
            if (!closestSlot) {
                closestSlot = findClosestSlot(
                    orderPriceRounded,
                    buySlots,
                    gapTreshold * 2,
                );
            }
            if (closestSlot) {
                slots.add(formatNum(closestSlot, filledResolution.current));
            }
        }
        return slots;
    }, [userSymbolOrders, buySlots, findClosestSlot]);

    const userSellSlots: Set<string> = useMemo(() => {
        if (!filledResolution.current) return new Set<string>();
        const precision = getPrecisionForResolution(filledResolution.current);
        const gapTreshold = filledResolution.current.val / 2;
        const slots = new Set<string>();
        const sellOrders = userSymbolOrders.filter(
            (order) => order.side === 'sell',
        );

        for (const order of sellOrders) {
            const orderPriceRounded = Number(
                Number(order.limitPx).toFixed(precision),
            );
            let closestSlot = findClosestSlot(
                orderPriceRounded,
                sellSlots,
                gapTreshold,
            );
            if (!closestSlot) {
                closestSlot = findClosestSlot(
                    orderPriceRounded,
                    sellSlots,
                    gapTreshold * 2,
                );
            }
            if (closestSlot) {
                slots.add(formatNum(closestSlot, filledResolution.current));
            }
        }
        return slots;
    }, [userSymbolOrders, sellSlots, findClosestSlot]);

    const focusedPriceRef = useRef<number | null>(null);
    // code blocks were being used in sdk approach

    useEffect(() => {
        if (obPreviewLine?.yPrice) {
            focusedPriceRef.current = obPreviewLine.yPrice;
        }
    }, [obPreviewLine?.yPrice]);

    useEffect(() => {
        if (orderInputPriceValue.value) {
            focusedPriceRef.current = orderInputPriceValue.value;

            // COMMENTED OUT >> CODE BLOCK FOR FINDING PROPER RESOLUTION
            // if (
            //     orderInputPriceValue.changeType === 'dragEnd' &&
            //     !foundClosestSlotForFocusedPriceRef.current
            // ) {
            //     findProperResolution(focusedPriceRef.current);
            //     lockOrderBook.current = true;
            // }
        } else {
            focusedPriceRef.current = null;
            setFocusedSlotOutOfBounds(null);
        }
    }, [orderInputPriceValue.value]);

    useEffect(() => {
        if (buys.length > 0) {
            if (buys.length > orderCount) {
                setObMinBuy(buys[orderCount - 1].px);
            } else {
                setObMinBuy(buys[buys.length - 1].px);
            }
            setObMaxBuy(buys[0].px);
        }
        if (sells.length > 0) {
            if (sells.length > orderCount) {
                setObMaxSell(
                    sells[orderCount - 1].px +
                        (selectedResolutionRef.current?.val || 0),
                );
            } else {
                setObMaxSell(
                    sells[sells.length - 1].px +
                        (selectedResolutionRef.current?.val || 0),
                );
            }
            setObMinSell(sells[0].px);
        }
    }, [buys, sells, orderCount]);

    useEffect(() => {
        if (
            !filledResolution.current ||
            !symbolInfo ||
            !focusedPriceRef.current ||
            !buys.length ||
            !sells.length ||
            !midPriceRef.current ||
            isMobile
        ) {
            setFocusedSlot(null);
            return;
        }

        if (isMidModeActive) {
            if (tradeDirection === 'buy') {
                setFocusedSlot({
                    price: buys[0].px,
                    side: 'buy',
                });
            } else {
                setFocusedSlot({
                    price: sells[0].px,
                    side: 'sell',
                });
            }
            return;
        }

        let side;
        let targetSlots;

        if (focusedPriceRef.current < midPriceRef.current) {
            side = 'buy';
            targetSlots = buys.slice(0, orderCount).map((buy) => buy.px);
        } else {
            side = 'sell';
            targetSlots = sells.slice(0, orderCount).map((sell) => sell.px);
        }

        let closestSlot = findClosestByFlooring(
            focusedPriceRef.current,
            targetSlots,
        );

        setFocusedSlotOutOfBounds(null);
        if (closestSlot) {
            setFocusedSlot({
                price: closestSlot,
                side: side as 'buy' | 'sell',
            });
            foundClosestSlotForFocusedPriceRef.current = true;
        } else if (side === 'sell' && focusedPriceRef.current < sells[0].px) {
            setFocusedSlot({
                price: sells[0].px,
                side: 'sell',
            });
            foundClosestSlotForFocusedPriceRef.current = true;
        } else {
            foundClosestSlotForFocusedPriceRef.current = false;
            setFocusedSlot(null);
            if (side === 'buy') {
                setFocusedSlotOutOfBounds('buy');
            } else {
                setFocusedSlotOutOfBounds('sell');
            }
        }
    }, [
        orderInputPriceValue.value,
        buys,
        sells,
        obPreviewLine?.yPrice,
        isMidModeActive,
        orderCount,
        isMobile,
    ]);

    // COMMENTED OUT >> CODE BLOCK FOR FINDING PROPER RESOLUTION

    // const findProperResolution = useCallback(
    //     (focusedPrice: number) => {
    //         if (!midPriceRef.current) return;
    //         if (!filledResolution.current) return;

    //         const currentResolution = filledResolution.current;
    //         const side = focusedPrice < midPriceRef.current ? 'buy' : 'sell';

    //         const thresholdRatioForPickingResolution = 1;
    //         let found = false;

    //         for (let i = 0; i < resolutions.length; i++) {
    //             const res = resolutions[i];
    //             if (res.val >= currentResolution.val) {
    //                 const remaining = midPriceRef.current % res.val;
    //                 const startPrice =
    //                     midPriceRef.current -
    //                     remaining +
    //                     (side === 'buy' ? 0 : res.val);
    //                 const endPrice =
    //                     startPrice +
    //                     (orderCount - 1) * res.val * (side === 'buy' ? -1 : 1);

    //                 const distFocusedPrice = Math.abs(
    //                     focusedPrice - startPrice,
    //                 );
    //                 const distRange = Math.abs(endPrice - startPrice);

    //                 if (
    //                     distFocusedPrice / distRange <
    //                     thresholdRatioForPickingResolution
    //                 ) {
    //                     setSelectedResolution(res);
    //                     lockOrderBook.current = false;
    //                     found = true;
    //                     break;
    //                 }
    //             }
    //         }

    //         if (!found) {
    //             setSelectedResolution(resolutions[resolutions.length - 1]);
    //         }
    //     },
    //     [orderCount, resolutions],
    // );

    // COMMENTED OUT >> CODE BLOCK WAS USED IN SDK APPROACH
    // const handleOrderBookWorkerResult = useCallback(
    //     ({ data }: { data: OrderBookOutput }) => {
    //         setOrderBook(data.buys, data.sells);
    //         setOrderBookState(TableState.FILLED);
    //         filledResolution.current = selectedResolution;
    //     },
    //     [selectedResolution, setOrderBook],
    // );

    // const postOrderBookRaw = useWorker<OrderBookOutput>(
    //     'orderbook',
    //     handleOrderBookWorkerResult,
    // );

    const usualResolution = useMemo(() => {
        return resolutionPairs[symbol] || resolutions[0];
    }, [symbol, resolutions, resolutionPairs]);

    useEffect(() => {
        setUsualResolution(usualResolution);
    }, [usualResolution]);

    // Memoize usualResolution to avoid unnecessary re-renders
    const usualResolutionKey = useMemo(
        () =>
            usualResolution
                ? `${usualResolution.val}_${usualResolution.nsigfigs || ''}_${usualResolution.mantissa || ''}`
                : '',
        [usualResolution],
    );

    useEffect(() => {
        if (symbol === symbolInfo?.coin) {
            const resolutionList = getResolutionListForSymbol(symbolInfo);
            setResolutions(resolutionList);
            setSelectedResolution(usualResolution);
        }
    }, [symbol, symbolInfo?.coin, usualResolutionKey]);

    const subKey = useMemo(() => {
        if (!selectedResolution) return undefined;
        return {
            type: 'l2Book' as const,
            coin: symbol,
            ...(selectedResolution.nsigfigs
                ? { nSigFigs: selectedResolution.nsigfigs }
                : {}),
            ...(selectedResolution.mantissa
                ? { mantissa: selectedResolution.mantissa }
                : {}),
        };
    }, [selectedResolution, symbol]);

    const handleOrderBookResult = useCallback(
        (payload: any) => {
            try {
                const { buys, sells } = processOrderBookMessage(payload);
                //set mid price if we are polling with lowest resolution
                setOrderBook(buys, sells, !needExtraPollingRef.current);
                setOrderBookState(TableState.FILLED);
                filledResolution.current = selectedResolution;
                lastMessageTimeRef.current = Date.now();
                setWsError(null);
            } catch (error) {
                console.error('Error processing orderbook message:', error);
                setWsError('Failed to process orderbook data');
            }
        },
        [selectedResolution, setOrderBook, setOrderBookState],
    );

    useEffect(() => {
        if (!subKey) return;
        setOrderBookState(TableState.LOADING);
        if (subKey) {
            // subscribeToPoller(
            //     'info',
            //     subKey,
            //     postOrderBookRaw,
            //     TIMEOUT_OB_POLLING,
            //     true,
            // );

            // const { unsubscribe } = info.subscribe(subKey, postOrderBookRaw);

            subscribe('l2Book', {
                payload: subKey,
                handler: handleOrderBookResult,
                single: true,
            });

            // Only force reconnect if no messages received for 5 seconds
            forceReconnectInterval.current = setInterval(() => {
                const timeSinceLastMessage =
                    Date.now() - lastMessageTimeRef.current;
                if (timeSinceLastMessage > 5000) {
                    console.warn(
                        'No orderbook updates for 5s, reconnecting...',
                    );
                    forceReconnect();
                    lastMessageTimeRef.current = Date.now();
                }
            }, 6000);

            return () => {
                // unsubscribeFromPoller('info', subKey);
                // unsubscribe();
                unsubscribe('l2Book', {
                    payload: subKey,
                    handler: handleOrderBookResult,
                    single: true,
                } as WsSubscriptionConfig);
                if (forceReconnectInterval.current) {
                    clearInterval(forceReconnectInterval.current);
                }
            };
        }
    }, [subKey]);

    const midHeader = useCallback(
        (id: string) => {
            const buyArr =
                needExtraPolling && lwBuys.length > 0 ? lwBuys : buys;
            const sellArr =
                needExtraPolling && lwSells.length > 0 ? lwSells : sells;
            let diff = 0;
            if (
                buyArr.length > 0 &&
                sellArr.length > 0 &&
                orderBookState === TableState.FILLED
            ) {
                diff = sellArr[0].px - buyArr[0].px;
            }
            return (
                <div id={id} className={styles.orderBookBlockMid}>
                    <div>{t('orderBook.spread')}</div>
                    <div>
                        {diff > 0 ? new Number(diff.toFixed(6)).toString() : ''}
                    </div>
                    <div>
                        {symbolInfo?.markPx &&
                            diff > 0 &&
                            new Number(
                                ((diff / symbolInfo?.markPx) * 100).toFixed(3),
                            ).toString()}
                        %
                    </div>
                </div>
            );
        },
        [
            buys,
            sells,
            symbolInfo,
            orderBookState,
            lwBuys,
            lwSells,
            needExtraPolling,
        ],
    );

    const rowClickHandler = useCallback(
        (order: OrderBookRowIF, type: OrderRowClickTypes, rowIndex: number) => {
            if (orderClickDisabled) return;

            if (rowLockTimeoutRef.current) {
                clearTimeout(rowLockTimeoutRef.current);
            }
            lockOrderBook.current = true;
            if (type === OrderRowClickTypes.PRICE) {
                setObChosenPrice(order.px);
            } else if (type === OrderRowClickTypes.AMOUNT) {
                let amount = 0;
                if (order.type === 'buy') {
                    for (let i = 0; i <= rowIndex; i++) {
                        amount += buys[i].sz;
                    }
                } else {
                    for (let i = 0; i < orderCount - rowIndex; i++) {
                        amount += sells[i].sz;
                    }
                }
                setObChosenPrice(order.px);
                setObChosenAmount(amount);
            }
            rowLockTimeoutRef.current = setTimeout(() => {
                lockOrderBook.current = false;
            }, 1000);

            if (switchTab) {
                // Simplified animation without nested setTimeout chains
                const obRow = document.getElementById('order-row-' + order.px);
                obRow?.classList.add('divPulse');

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        obRow?.classList.remove('divPulse');
                        switchTab('order' as TabType);

                        // Focus the input after switching tabs
                        requestAnimationFrame(() => {
                            const orderElem = document.getElementById(
                                'trade-module-price-input-container',
                            );
                            orderElem?.classList.add('divPulse');
                            setTimeout(() => {
                                orderElem?.classList.remove('divPulse');
                            }, 800);
                        });
                    }, 400);
                });
            }
        },
        [
            buys,
            sells,
            orderCount,
            setObChosenPrice,
            setObChosenAmount,
            switchTab,
        ],
    );

    // Deterministic pseudo-random generator based on index to avoid SSR hydration mismatches
    const seededRandom = useCallback((n: number) => {
        // Mulberry-like simple PRNG using only the index for determinism across server and client
        let t = (n + 0x6d2b79f5) | 0;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // in [0,1)
    }, []);

    const getRandWidth = useCallback(
        (index: number, inverse: boolean = false) => {
            const jitter = seededRandom(index) * 20; // 0..20
            let rand;
            if (inverse) {
                rand = 100 / orderCount + index * (100 / orderCount) + jitter;
            } else {
                rand = 100 - index * (100 / orderCount) + jitter;
            }
            const clamped = Math.min(rand, 100);
            return clamped + '%';
        },
        [orderCount, seededRandom],
    );

    const assignSelectedResolution = useCallback(
        (resolution: OrderRowResolutionIF) => {
            setSelectedResolution(resolution);
            addToResolutionPair(symbol, resolution);
        },
        [symbol, addToResolutionPair],
    );

    return (
        <div
            id='orderBookContainerInner'
            className={styles.orderBookContainer}
            style={{
                ...(heightOverride && {
                    height: heightOverride,
                }),
            }}
        >
            <div id={'orderBookHeader1'} className={styles.orderBookHeader}>
                <ComboBox
                    value={selectedResolution?.val}
                    options={resolutions}
                    fieldName='val'
                    onChange={(value) => {
                        const resolution = resolutions.find(
                            (resolution) => resolution.val === Number(value),
                        );
                        if (resolution) {
                            if (typeof plausible === 'function') {
                                plausible('Resolution Update', {
                                    props: {
                                        resolutionType: 'orderbook',
                                        resolution: resolution.val,
                                    },
                                });
                            }
                            assignSelectedResolution(resolution);
                        }
                    }}
                />
                <ComboBox
                    value={
                        selectedMode === 'symbol' ? symbol.toUpperCase() : 'USD'
                    }
                    options={[symbol.toUpperCase(), 'USD']}
                    onChange={(value) =>
                        setSelectedMode(
                            value === symbol.toUpperCase() ? 'symbol' : 'usd',
                        )
                    }
                />
            </div>
            <div id={'orderBookHeader2'} className={styles.orderBookHeader}>
                <div>{t('transactions.price')}</div>
                <div>
                    {t('transactions.size')}
                    {selectedMode === 'symbol'
                        ? `(${symbol.toUpperCase()})`
                        : '(USD)'}
                </div>
                <div>
                    {t('transactions.total')}
                    {selectedMode === 'symbol'
                        ? `(${symbol.toUpperCase()})`
                        : '(USD)'}
                </div>
            </div>
            <BasicDivider />
            {wsError && <div className={styles.errorMessage}>{wsError}</div>}
            <div id='dummyOrderRow' className={styles.dummyOrderRow}>
                <OrderRow
                    rowIndex={0}
                    order={dummyOrder}
                    coef={1}
                    resolution={filledResolution.current}
                    userSlots={userBuySlots}
                    clickListener={() => {}}
                    formatNum={formatNum}
                    getBsColor={getBsColor}
                />
            </div>
            {orderBookState === TableState.LOADING && (
                <motion.div
                    className={
                        styles.skeletonWrapper + ' ' + styles.orderSlotsWrapper
                    }
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className={styles.orderBookBlock}
                        style={{ gap: 'var(--gap-xs)' }}
                    >
                        {Array.from({ length: orderCount }).map((_, index) => (
                            <div key={index} className={styles.orderRowWrapper}>
                                <SkeletonNode
                                    width={getRandWidth(index)}
                                    height={orderRowHeight + 'px'}
                                />
                            </div>
                        ))}
                    </div>
                    {midHeader('orderBookMidHeader2')}
                    <div
                        className={styles.orderBookBlock}
                        style={{ gap: 'var(--gap-xs)' }}
                    >
                        {Array.from({ length: orderCount }).map((_, index) => (
                            <div key={index} className={styles.orderRowWrapper}>
                                <SkeletonNode
                                    width={getRandWidth(index, true)}
                                    height={orderRowHeight + 'px'}
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
            {orderBookState === TableState.FILLED &&
                buys.length > 0 &&
                sells.length > 0 &&
                buys[0].coin === symbol &&
                sells[0].coin === symbol && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className={styles.orderSlotsWrapper}
                            id={'orderBookSlotsWrapper'}
                        >
                            {focusedSlotOutOfBounds && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div
                                            className={`${styles.obGradientForFocusedSlot} ${styles.smaller} ${focusedSlotOutOfBounds === 'buy' ? styles.buy : ''}`}
                                        ></div>
                                        <div
                                            className={`${styles.obGradientForFocusedSlot} ${focusedSlotOutOfBounds === 'buy' ? styles.buy : ''}`}
                                        ></div>
                                        <div
                                            className={`${styles.obGradientForFocusedSlot} ${styles.wider} ${focusedSlotOutOfBounds === 'buy' ? styles.buy : ''}`}
                                        ></div>
                                    </motion.div>
                                </>
                            )}

                            <div
                                className={styles.obGradientEffect}
                                style={{
                                    background: `linear-gradient(to bottom,  ${getBsColor().sell} 0%, var(--bg-dark2) 100%)`,
                                }}
                            ></div>
                            <div
                                className={
                                    styles.obGradientEffect +
                                    ' ' +
                                    styles.smaller
                                }
                                style={{
                                    background: `linear-gradient(to bottom,  ${getBsColor().sell} 0%, var(--bg-dark2) 100%)`,
                                }}
                            ></div>
                            <div
                                className={
                                    styles.obGradientEffect +
                                    ' ' +
                                    styles.obGradientEffectBottom
                                }
                                style={{
                                    background: `linear-gradient(to top,  ${getBsColor().buy} 0%, var(--bg-dark2) 100%)`,
                                }}
                            ></div>
                            <div
                                className={
                                    styles.obGradientEffect +
                                    ' ' +
                                    styles.smaller +
                                    ' ' +
                                    styles.obGradientEffectBottom
                                }
                                style={{
                                    background: `linear-gradient(to top,  ${getBsColor().buy} 0%, var(--bg-dark2) 100%)`,
                                }}
                            ></div>
                            <div
                                id={'orderbook-sell-block'}
                                className={styles.orderBookBlock}
                            >
                                {sellPlaceHolderCount === 1 ? (
                                    <div className={styles.orderRowWrapper}>
                                        <div
                                            className={styles.blankRowContent}
                                            style={{
                                                opacity: 1,
                                                backgroundColor: `color-mix(in srgb, ${getBsColor().sell} 20%, transparent )`,
                                            }}
                                        >
                                            &nbsp;
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {Array.from({
                                            length: sellPlaceHolderCount,
                                        }).map((_, index) => (
                                            <div
                                                key={index}
                                                className={
                                                    styles.orderRowWrapper +
                                                    ' ' +
                                                    styles.blankRow
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.blankRowContent
                                                    }
                                                    style={{
                                                        opacity:
                                                            1 -
                                                            (sellPlaceHolderCount -
                                                                index) /
                                                                sellPlaceHolderCount,
                                                        backgroundColor: `color-mix(in srgb, ${getBsColor().sell} 20%, transparent )`,
                                                    }}
                                                >
                                                    &nbsp;
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {sells
                                    .slice(0, orderCount)
                                    .reverse()
                                    .map((order, index) => (
                                        <div
                                            id={`order-sell-srow-${index}`}
                                            key={order.px}
                                            className={styles.orderRowWrapper}
                                        >
                                            <OrderRow
                                                rowIndex={index}
                                                order={order}
                                                coef={
                                                    selectedMode === 'symbol'
                                                        ? 1
                                                        : (symbolInfo?.markPx ??
                                                          0)
                                                }
                                                resolution={
                                                    filledResolution.current
                                                }
                                                userSlots={userSellSlots}
                                                clickListener={rowClickHandler}
                                                getBsColor={getBsColor}
                                                formatNum={formatNum}
                                                obFocusedSlotPrice={
                                                    focusedSlot?.side === 'sell'
                                                        ? focusedSlot?.price
                                                        : undefined
                                                }
                                            />
                                            <div
                                                className={styles.ratioBar}
                                                style={{
                                                    width: `${order.ratio ? order.ratio * 100 : 0}%`,
                                                    backgroundColor:
                                                        order.type === 'sell'
                                                            ? getBsColor().sell
                                                            : getBsColor().buy,
                                                }}
                                            ></div>
                                        </div>
                                    ))}
                            </div>

                            {midHeader('orderBookMidHeader')}

                            <div
                                id={'orderbook-buy-block'}
                                className={styles.orderBookBlock}
                            >
                                {buys
                                    .slice(0, orderCount)
                                    .map((order, index) => (
                                        <div
                                            key={order.px}
                                            className={styles.orderRowWrapper}
                                        >
                                            <OrderRow
                                                rowIndex={index}
                                                order={order}
                                                coef={
                                                    selectedMode === 'symbol'
                                                        ? 1
                                                        : (symbolInfo?.markPx ??
                                                          0)
                                                }
                                                resolution={
                                                    filledResolution.current
                                                }
                                                userSlots={userBuySlots}
                                                clickListener={rowClickHandler}
                                                getBsColor={getBsColor}
                                                formatNum={formatNum}
                                                obFocusedSlotPrice={
                                                    focusedSlot?.side === 'buy'
                                                        ? focusedSlot?.price
                                                        : undefined
                                                }
                                            />
                                            <div
                                                className={styles.ratioBar}
                                                style={{
                                                    width: `${order.ratio ? order.ratio * 100 : 0}%`,
                                                    backgroundColor:
                                                        order.type === 'buy'
                                                            ? getBsColor().buy
                                                            : getBsColor().sell,
                                                }}
                                            ></div>
                                        </div>
                                    ))}
                                {Array.from({
                                    length: buyPlaceHolderCount,
                                }).map((_, index) => (
                                    <div
                                        key={index}
                                        className={
                                            styles.orderRowWrapper +
                                            ' ' +
                                            styles.blankRow
                                        }
                                    >
                                        <div
                                            className={styles.blankRowContent}
                                            style={{
                                                opacity:
                                                    1 -
                                                    index / buyPlaceHolderCount,
                                                backgroundColor: `color-mix(in srgb, ${getBsColor().buy} 20%, transparent )`,
                                            }}
                                        >
                                            &nbsp;
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
        </div>
    );
};

export default React.memo(OrderBook);
