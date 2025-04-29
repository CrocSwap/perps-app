import { useCallback, useEffect, useRef } from 'react';
import BasicDivider from '~/components/Dividers/BasicDivider';
import { useSdk } from '~/hooks/useSdk';
import { processTrades } from '~/processors/processOrderBook';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { WsChannels } from '~/utils/Constants';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderbooktrades.module.css';
import OrderTradeRow from './ordertraderow/ordertraderow';

interface OrderBookTradesProps {
    symbol: string;
    tradesCount: number;
}

const OrderBookTrades: React.FC<OrderBookTradesProps> = ({
    symbol,
    tradesCount,
}) => {
    const { info } = useSdk();
    const { trades, setTrades } = useOrderBookStore();

    const { orderBookMode } = useAppSettings();

    const tradesRef = useRef<OrderBookTradeIF[]>([]);
    tradesRef.current = trades;

    const tradesCountRef = useRef(tradesCount);
    tradesCountRef.current = tradesCount;

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
                            tradesCountRef.current,
                        ),
                    );
                } else {
                    setTrades(wsTrades.slice(0, tradesCountRef.current));
                }
            }
        },
        [tradesCount, info],
    );

    useEffect(() => {
        if (!info) return;
        if (!symbol || symbol.length === 0) return;

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

    return (
        <div className={styles.orderTradesContainer}>
            <div className={styles.orderTradesHeader}>
                <div>Price</div>
                <div>Size {'(' + symbol + ')'}</div>
                <div>Time</div>
            </div>

            <BasicDivider />
            {trades.length > 0 && trades[0].coin === symbol && (
                <>
                    <div
                        className={`${styles.orderTradesList} ${orderBookMode === 'stacked' ? styles.orderTradesListStacked : ''}`}
                    >
                        {trades.map((trade) => (
                            <OrderTradeRow key={trade.tid} trade={trade} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderBookTrades;
