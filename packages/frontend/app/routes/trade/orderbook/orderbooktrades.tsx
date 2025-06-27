import { useCallback, useEffect, useRef, useState } from 'react';
import BasicDivider from '~/components/Dividers/BasicDivider';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import { useSdk } from '~/hooks/useSdk';
import { processTrades } from '~/processors/processOrderBook';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { TableState } from '~/utils/CommonIFs';
import { WsChannels } from '~/utils/Constants';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderbooktrades.module.css';
import OrderTradeRow from './ordertraderow/ordertraderow';

interface OrderBookTradesProps {
    symbol: string;
    tradesCount: number;
    maxHeight?: number;
}

const TRADES_LIMIT = 50;

const OrderBookTrades: React.FC<OrderBookTradesProps> = ({
    symbol,
    tradesCount,
    maxHeight,
}) => {
    const { info } = useSdk();
    const { trades, setTrades } = useOrderBookStore();

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const { orderBookMode } = useAppSettings();

    const tradesRef = useRef<OrderBookTradeIF[]>([]);
    tradesRef.current = trades;

    const symbolRef = useRef(symbol);
    symbolRef.current = symbol;

    const mergeTrades = useCallback(
        (wsTrades: OrderBookTradeIF[]) => {
            if (
                wsTrades &&
                wsTrades.length > 0 &&
                wsTrades[0].coin === symbolRef.current
            ) {
                if (
                    tradesRef.current.length > 0 &&
                    tradesRef.current[0].coin === symbolRef.current
                ) {
                    const newTrades = wsTrades.filter(
                        (trade) =>
                            trade.coin === symbolRef.current &&
                            !tradesRef.current.some((e) => e.tid === trade.tid),
                    );
                    setTrades(
                        [...newTrades, ...tradesRef.current].slice(
                            0,
                            TRADES_LIMIT,
                        ),
                    );
                } else {
                    setTrades(wsTrades.slice(0, TRADES_LIMIT));
                }
                setTableState(TableState.FILLED);
            }
        },
        [info],
    );

    useEffect(() => {
        if (!info) return;
        if (!symbol || symbol.length === 0) return;

        setTableState(TableState.LOADING);

        const { unsubscribe } = info.subscribe(
            {
                type: WsChannels.ORDERBOOK_TRADES,
                coin: symbol,
            },
            postOrderBookTrades,
        );

        return unsubscribe;
    }, [symbol, info]);

    const postOrderBookTrades = useCallback(
        (payload: any) => {
            mergeTrades(processTrades(payload.data));
        },
        [trades],
    );

    const loaderLen = 20;

    return (
        <div className={styles.orderTradesContainer}>
            <div id='orderTradesHeader' className={styles.orderTradesHeader}>
                <div>Price</div>
                <div>Size {'(' + symbol + ')'}</div>
                <div>Time</div>
            </div>

            <BasicDivider />
            {tableState === TableState.LOADING && (
                <div
                    className={`${styles.orderTradesList} ${styles.orderTradesListLoading} ${orderBookMode === 'stacked' ? styles.orderTradesListStacked : ''}`}
                >
                    {Array.from({ length: loaderLen }).map((_, index) => (
                        <SkeletonNode
                            height={'19px'}
                            wrapperStyle={{
                                opacity: 1 - index / loaderLen,
                            }}
                        />
                    ))}
                </div>
            )}
            {tableState === TableState.FILLED &&
                trades.length > 0 &&
                trades[0].coin === symbol && (
                    <>
                        <div
                            className={`${styles.orderTradesList} ${orderBookMode === 'stacked' ? styles.orderTradesListStacked : ''}`}
                            style={{
                                ...(maxHeight && {
                                    maxHeight: maxHeight + 'px',
                                    overflowY: 'auto',
                                }),
                            }}
                        >
                            {trades
                                // .slice(0, tradesCount) // NOTE: that slicing has been removed because scrolling has been enabled
                                .slice(0, TRADES_LIMIT)
                                .map((trade, index) => (
                                    <OrderTradeRow key={index} trade={trade} />
                                ))}
                        </div>
                    </>
                )}
        </div>
    );
};

export default OrderBookTrades;
