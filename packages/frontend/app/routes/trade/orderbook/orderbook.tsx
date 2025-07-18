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

const OrderBook: React.FC<OrderBookProps> = ({
    symbol,
    orderCount,
    heightOverride,
}) => {
    const { info } = useSdk();

    const orderRowHeight = useMemo(() => {
        const dummyOrderRow = document.getElementById('dummyOrderRow');
        return dummyOrderRow?.getBoundingClientRect()?.height || 16;
    }, []);

    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);

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
    } = useOrderBookStore();
    const rowLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // No useMemo for simple arithmetic
    const buyPlaceHolderCount = Math.max(orderCount - buys.length, 0);
    const sellPlaceHolderCount = Math.max(orderCount - sells.length, 0);

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
    } = useTradeDataStore();
    const userOrdersRef = useRef<OrderDataIF[]>([]);

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
        userSymbolOrders
            .filter((order) => order.side === 'buy')
            .forEach((order) => {
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
            });
        return slots;
    }, [userSymbolOrders, buySlots, findClosestSlot, formatNum]);

    const userSellSlots: Set<string> = useMemo(() => {
        if (!filledResolution.current) return new Set<string>();
        const precision = getPrecisionForResolution(filledResolution.current);
        const gapTreshold = filledResolution.current.val / 2;
        const slots = new Set<string>();
        userSymbolOrders
            .filter((order) => order.side === 'sell')
            .forEach((order) => {
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
            });
        return slots;
    }, [userSymbolOrders, sellSlots, findClosestSlot, formatNum]);

    const handleOrderBookWorkerResult = useCallback(
        ({ data }: { data: OrderBookOutput }) => {
            setOrderBook(data.buys, data.sells);
            setOrderBookState(TableState.FILLED);
            filledResolution.current = selectedResolution;
        },
        [selectedResolution, setOrderBook, setOrderBookState],
    );

    const postOrderBookRaw = useWorker<OrderBookOutput>(
        'orderbook',
        handleOrderBookWorkerResult,
    );

    useEffect(() => {
        if (symbol === symbolInfo?.coin) {
            const resolutionList = getResolutionListForSymbol(symbolInfo);
            setResolutions(resolutionList);
            if (!selectedResolution) {
                setSelectedResolution(resolutionList[0]);
            }
        }
    }, [symbol, symbolInfo?.coin, selectedResolution, setSelectedResolution]);

    useEffect(() => {
        if (!info) return;
        setOrderBookState(TableState.LOADING);
        if (selectedResolution) {
            const subKey = {
                type: 'l2Book' as const,
                coin: symbol,
                ...(selectedResolution.nsigfigs
                    ? { nSigFigs: selectedResolution.nsigfigs }
                    : {}),
                ...(selectedResolution.mantissa
                    ? { mantissa: selectedResolution.mantissa }
                    : {}),
            };
            const { unsubscribe } = info.subscribe(subKey, postOrderBookRaw);
            return () => {
                unsubscribe();
            };
        }
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
                        >
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
                            <div className={styles.orderBookBlock}>
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
                                            key={index}
                                            className={styles.orderRowWrapper}
                                        >
                                            <OrderRow
                                                rowIndex={index}
                                                key={order.px}
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

                            <div className={styles.orderBookBlock}>
                                {buys
                                    .slice(0, orderCount)
                                    .map((order, index) => (
                                        <div
                                            key={index}
                                            className={styles.orderRowWrapper}
                                        >
                                            <OrderRow
                                                rowIndex={index}
                                                key={order.px}
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
