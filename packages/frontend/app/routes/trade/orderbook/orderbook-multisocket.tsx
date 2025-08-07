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
import { useSdk } from '~/hooks/useSdk';
import { useWorker } from '~/hooks/useWorker';
import type { OrderBookOutput } from '~/hooks/workers/orderbook.worker';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
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

interface OrderBookProps {
    symbol: string;
    orderCount: number;
    heightOverride?: string;
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
    return useMemo(() => orders.map((order) => order.px), [orders]);
}

/**
 * OrderBook component using the multi-socket architecture
 * This is a proof of concept showing how to use the market socket
 * for order book data instead of the single shared socket
 */
const OrderBookMultiSocket: React.FC<OrderBookProps> = ({
    symbol,
    orderCount,
    heightOverride,
}) => {
    // Use the SDK's info object which now has multi-socket enabled
    const { info } = useSdk();

    const orderRowHeight = useMemo(() => {
        const dummyOrderRow = document.getElementById('dummyOrderRow');
        return dummyOrderRow?.getBoundingClientRect()?.height || 16;
    }, []);

    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
    const [selectedResolution, setSelectedResolution] =
        useState<OrderRowResolutionIF | null>(null);

    const [orderBookState, setOrderBookState] = useState(TableState.LOADING);

    const filledResolution = useRef<OrderRowResolutionIF | null>(null);
    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');
    const { formatNum } = useNumFormatter();
    const lockOrderBook = useRef<boolean>(false);
    const { getBsColor } = useAppSettings();
    const { buys, sells, setOrderBook } = useOrderBookStore();
    const rowLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // No useMemo for simple arithmetic
    const buyPlaceHolderCount = Math.max(orderCount - buys.length, 0);
    const sellPlaceHolderCount = Math.max(orderCount - sells.length, 0);

    const {
        userOrders,
        userSymbolOrders,
        symbolInfo,
        setObChosenPrice,
        setObChosenAmount,
    } = useTradeDataStore();
    const userOrdersRef = useRef<OrderDataIF[]>([]);

    // Use custom hook for stable slot arrays
    const buySlots = useOrderSlots(buys);
    const sellSlots = useOrderSlots(sells);

    const orderCountRef = useRef<number>(0);
    orderCountRef.current = orderCount;

    const findClosestSlot = useCallback(
        (orders: OrderDataIF[], slots: number[], targetPrice: number) => {
            return orders.reduce<Record<number, OrderDataIF[]>>(
                (acc, order) => {
                    const closestSlot = slots.reduce((prev, curr) =>
                        Math.abs(curr - targetPrice) <
                        Math.abs(prev - targetPrice)
                            ? curr
                            : prev,
                    );
                    acc[closestSlot] = [...(acc[closestSlot] || []), order];
                    return acc;
                },
                {},
            );
        },
        [],
    );

    const userBuySlots = useMemo(() => {
        const userBuyOrders = userOrdersRef.current.filter(
            (order) => order.side === 'B',
        );
        return findClosestSlot(userBuyOrders, buySlots, 0);
    }, [buySlots, findClosestSlot]);

    const userSellSlots = useMemo(() => {
        const userSellOrders = userOrdersRef.current.filter(
            (order) => order.side === 'A',
        );
        return findClosestSlot(userSellOrders, sellSlots, Infinity);
    }, [sellSlots, findClosestSlot]);

    useEffect(() => {
        userOrdersRef.current =
            selectedMode === 'symbol' ? userSymbolOrders : userOrders;
    }, [selectedMode, userSymbolOrders, userOrders]);

    const { postMessage } = useWorker('/workers/orderbook.worker.js');

    const postOrderBookRaw = useCallback(
        (data: any) => {
            postMessage(
                {
                    data,
                    symbolInfo,
                    orderCount: orderCountRef.current,
                    orders: userOrdersRef.current,
                    mode: selectedMode,
                },
                (output: OrderBookOutput) => {
                    if (!lockOrderBook.current) {
                        filledResolution.current = output.resolution;
                        setOrderBook(output.buys, output.sells);
                        setOrderBookState(TableState.LOADED);
                    }
                },
            );
        },
        [postMessage, symbolInfo, selectedMode, setOrderBook],
    );

    useEffect(() => {
        if (symbolInfo?.coin) {
            const newResolutions = getResolutionListForSymbol(symbolInfo.coin);
            setResolutions(newResolutions);
        }
    }, [symbolInfo?.coin]);

    useEffect(() => {
        const decimals = getPrecisionForResolution(resolutions[0]);
        const newFormat = `1.${decimals[1] - decimals[0]}`;
        if (selectedResolution?.displayFormat !== newFormat) {
            setSelectedResolution(resolutions[0]);
        }
    }, [resolutions, selectedResolution, symbol]);

    useEffect(() => {
        if (
            symbolInfo?.coin &&
            selectedResolution &&
            !filledResolution.current
        ) {
            filledResolution.current = selectedResolution;
        }
    }, [selectedResolution, symbolInfo?.coin]);

    useEffect(() => {
        if (symbol !== symbolInfo?.coin) {
            setOrderBook([], []);
            filledResolution.current = null;
        }
    }, [symbol, symbolInfo?.coin]);

    // Use info object which now routes l2Book to market socket automatically
    useEffect(() => {
        if (!info) return;

        setOrderBookState(TableState.LOADING);
        console.log({ selectedResolution });
        const selectedResolutionOrFallback = selectedResolution || {
            nsigfigs: null,
            val: 1,
            mantissa: null,
        };
        const subscription = {
            type: 'l2Book' as const,
            coin: 'BTC' as const,
            // coin: symbol ,
            ...(selectedResolutionOrFallback.nsigfigs
                ? { nSigFigs: selectedResolutionOrFallback.nsigfigs }
                : {}),
            ...(selectedResolutionOrFallback.mantissa
                ? { mantissa: selectedResolutionOrFallback.mantissa }
                : {}),
        };

        console.log({ subscription });
        // Subscribe using info - will automatically route to market socket
        const { unsubscribe } = info.subscribe(subscription, postOrderBookRaw);

        return () => {
            unsubscribe();
        };
    }, [selectedResolution, info, symbol, postOrderBookRaw]);

    const midHeader = useCallback(
        (id: string) => (
            <div id={id} className={styles.orderBookBlockMid}>
                <div>Spread</div>
                <div>{selectedResolution?.val}</div>
                <div>
                    {symbolInfo?.markPx &&
                        selectedResolution?.val &&
                        (
                            (selectedResolution?.val / symbolInfo?.markPx) *
                            100
                        ).toFixed(3)}
                    %
                </div>
            </div>
        ),
        [selectedResolution, symbolInfo],
    );

    const rowClickHandler = useCallback(
        (order: OrderBookRowIF, type: OrderRowClickTypes, rowIndex: number) => {
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
        },
        [buys, sells, orderCount, setObChosenPrice, setObChosenAmount],
    );

    const getRandWidth = useCallback(
        (index: number, inverse: boolean = false) => {
            let rand;
            if (inverse) {
                rand =
                    100 / orderCount +
                    index * (100 / orderCount) +
                    Math.random() * 20;
            } else {
                rand = 100 - index * (100 / orderCount) + Math.random() * 20;
            }
            return rand < 100 ? rand + '%' : '100%';
        },
        [orderCount],
    );

    return (
        <div
            id='orderBookContainer'
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
                            setSelectedResolution(resolution);
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
                <div>Price</div>
                <div>
                    Size{' '}
                    {selectedMode === 'symbol'
                        ? `(${symbol.toUpperCase()})`
                        : '(USD)'}
                </div>
                <div>
                    Total{' '}
                    {selectedMode === 'symbol'
                        ? `(${symbol.toUpperCase()})`
                        : '(USD)'}
                </div>
            </div>

            <BasicDivider />

            <div id='dummyOrderRow' className={styles.dummyOrderRow}>
                <OrderRow
                    rowIndex={0}
                    order={dummyOrder}
                    coef={1}
                    resolution={filledResolution.current}
                    userSlots={userBuySlots}
                    mode={selectedMode}
                    formatNum={formatNum}
                    onClick={rowClickHandler}
                />
            </div>

            <div
                className={styles.orderBookBlock}
                style={{
                    minHeight: `${orderCount * orderRowHeight}px`,
                    maxHeight: `${(orderCount + 0.5) * orderRowHeight}px`,
                }}
            >
                {orderBookState === TableState.LOADING ? (
                    <>
                        {Array.from(
                            { length: orderCount },
                            (_, index) => index,
                        ).map((index) => {
                            return (
                                <div
                                    key={`${index}-sell-skeleton`}
                                    className={styles.orderRow}
                                >
                                    <SkeletonNode
                                        width={getRandWidth(index, true)}
                                    />
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {Array.from(
                            { length: sellPlaceHolderCount },
                            (_, index) => index,
                        ).map((index) => {
                            return (
                                <div
                                    key={`${index}-sell-placeholder`}
                                    className={styles.orderRow}
                                />
                            );
                        })}
                        {sells.map((order, index) => (
                            <motion.div
                                initial={false}
                                layout='position'
                                transition={{ duration: 0.15 }}
                                key={`${order.px}`}
                            >
                                <OrderRow
                                    rowIndex={orderCount - 1 - index}
                                    order={order}
                                    coef={1}
                                    resolution={filledResolution.current}
                                    userSlots={userSellSlots}
                                    mode={selectedMode}
                                    formatNum={formatNum}
                                    onClick={rowClickHandler}
                                />
                            </motion.div>
                        ))}
                    </>
                )}
            </div>

            {midHeader('orderBookMid')}

            <div
                className={styles.orderBookBlock}
                style={{
                    minHeight: `${orderCount * orderRowHeight}px`,
                    maxHeight: `${(orderCount + 0.5) * orderRowHeight}px`,
                }}
            >
                {orderBookState === TableState.LOADING ? (
                    <>
                        {Array.from(
                            { length: orderCount },
                            (_, index) => index,
                        ).map((index) => {
                            return (
                                <div
                                    key={`${index}-buy-skeleton`}
                                    className={styles.orderRow}
                                >
                                    <SkeletonNode width={getRandWidth(index)} />
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {buys.map((order, index) => (
                            <motion.div
                                initial={false}
                                layout='position'
                                transition={{ duration: 0.15 }}
                                key={`${order.px}`}
                            >
                                <OrderRow
                                    rowIndex={index}
                                    order={order}
                                    coef={1}
                                    resolution={filledResolution.current}
                                    userSlots={userBuySlots}
                                    mode={selectedMode}
                                    formatNum={formatNum}
                                    onClick={rowClickHandler}
                                />
                            </motion.div>
                        ))}
                        {Array.from(
                            { length: buyPlaceHolderCount },
                            (_, index) => index,
                        ).map((index) => {
                            return (
                                <div
                                    key={`${index}-buy-placeholder`}
                                    className={styles.orderRow}
                                />
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderBookMultiSocket;
