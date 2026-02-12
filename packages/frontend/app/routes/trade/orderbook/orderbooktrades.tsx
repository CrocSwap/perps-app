import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import BasicDivider from '~/components/Dividers/BasicDivider';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import { useWs, type WsSubscriptionConfig } from '~/contexts/WsContext';
import { processTrades } from '~/processors/processOrderBook';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import { WsChannels } from '~/utils/Constants';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderbooktrades.module.css';
import OrderTradeRow from './ordertraderow/ordertraderow';

interface OrderBookTradesProps {
    maxHeight?: number;
}

const TRADES_LIMIT = 50;

const OrderBookTrades: React.FC<OrderBookTradesProps> = ({ maxHeight }) => {
    const { subscribe, unsubscribe, unsubscribeAllByChannel } = useWs();
    const { trades, setTrades } = useOrderBookStore();

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const { orderBookMode } = useAppSettings();

    const { symbol } = useTradeDataStore();

    const tradesRef = useRef<OrderBookTradeIF[]>([]);
    tradesRef.current = trades;

    const symbolRef = useRef(symbol);
    symbolRef.current = symbol;

    useEffect(() => {
        return () => {
            unsubscribeAllByChannel(WsChannels.ORDERBOOK_TRADES);
        };
    }, []);

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
        [setTrades],
    );

    useEffect(() => {
        if (!symbol || symbol.length === 0) return;

        setTableState(TableState.LOADING);

        const cfg = {
            payload: {
                type: WsChannels.ORDERBOOK_TRADES,
                coin: symbol,
            },
            handler: postOrderBookTrades,
            single: true,
        } as WsSubscriptionConfig;

        subscribe(WsChannels.ORDERBOOK_TRADES, cfg);

        return () => {
            unsubscribe(WsChannels.ORDERBOOK_TRADES, cfg);
        };
    }, [symbol]);

    const postOrderBookTrades = useCallback(
        (payload: any) => {
            mergeTrades(processTrades(payload));
        },
        [mergeTrades, processTrades],
    );

    const loaderLen = 30;

    return (
        <div className={styles.orderTradesContainer}>
            <div id='orderTradesHeader' className={styles.orderTradesHeader}>
                <div>{t('transactions.price')}</div>
                <div>{t('transactions.size') + ' (' + symbol + ')'}</div>
                <div>{t('transactions.time')}</div>
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
                            id='order-trades-list-container'
                            className={`${styles.orderTradesList} ${orderBookMode === 'stacked' ? styles.orderTradesListStacked : ''}`}
                            style={{
                                ...(maxHeight && {
                                    maxHeight: maxHeight + 'px',
                                    overflowY: 'auto',
                                }),
                            }}
                        >
                            {trades
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
