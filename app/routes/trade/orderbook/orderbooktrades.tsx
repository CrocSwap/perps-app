
import { useWsObserver, WsChannels } from '~/hooks/useWsObserver';
import styles from './orderbooktrades.module.css';
import { useCallback, useEffect, useRef } from 'react';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import { processOrderBookTrades } from '~/processors/processOrderBook';
import OrderTradeRow from './ordertraderow/ordertraderow';
import BasicDivider from '~/components/Dividers/BasicDivider';
import { useAppSettings } from '~/stores/AppSettingsStore';

interface OrderBookTradesProps {
  symbol: string;
  tradesCount: number;
}

const OrderBookTrades: React.FC<OrderBookTradesProps> = ({ symbol, tradesCount }) => {

  const { subscribe, unsubscribeAllByChannel} = useWsObserver();
  const { trades, setTrades } = useOrderBookStore();

  const { orderBookMode } = useAppSettings();
  
  const tradesRef = useRef<OrderBookTradeIF[]>([]);
  tradesRef.current = trades;

  const tradesCountRef = useRef(tradesCount);
  tradesCountRef.current = tradesCount;

  useEffect(() => {
    return () => {
      unsubscribeAllByChannel('trades');
    }
  }, [])


  const mergeTrades = useCallback((wsTrades: OrderBookTradeIF[]) => {
    if(wsTrades && wsTrades.length > 0 && wsTrades[0].coin === symbol) {
      if(tradesRef.current.length > 0 && tradesRef.current[0].coin === symbol) {
        const newTrades = wsTrades.filter((trade) => trade.coin === symbol && !tradesRef.current.some(e => e.tid === trade.tid) );
        setTrades([...newTrades, ...tradesRef.current].slice(0, tradesCountRef.current));
      } else {
        setTrades(wsTrades.slice(0, tradesCountRef.current));
      }
    }
  }, [symbol, tradesCount])

  useEffect(() => {
    subscribe(WsChannels.ORDERBOOK_TRADES, {
      payload: {coin: symbol},
      handler: (payload) => {
        mergeTrades(processOrderBookTrades(payload));

        
      },
      single: true
    })
  }, [symbol])

  return (
    <div className={styles.orderTradesContainer}>



<div className={styles.orderTradesHeader}>

<div>Price</div>
<div>Size {'(' + symbol + ')'}</div>
<div>Time</div>


</div>  

<BasicDivider />
{
  trades.length > 0 && trades[0].coin === symbol &&(
    <>
    <div className={`${styles.orderTradesList} ${orderBookMode === 'stacked' ? styles.orderTradesListStacked : ''}`}>
{trades.map((trade) => (
<OrderTradeRow key={trade.tid} trade={trade} />
))}
</div>
    </>
  )
}

    </div>
  );
}

export default OrderBookTrades;
