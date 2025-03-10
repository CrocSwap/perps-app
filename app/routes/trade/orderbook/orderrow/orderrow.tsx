import { useEffect, useMemo, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import type { OrderRowIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderrow.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';

interface OrderRowProps {
  order: OrderRowIF;
  coef: number;
  hasUserOrder?: boolean;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, coef, hasUserOrder }) => {

  const { formatNum } = useNumFormatter();

  const { buySellColor } = useAppSettings();

  const { setTradeSlot } = useTradeModuleStore();

  const type = useMemo(() => {
    if (order.type === 'buy' && buySellColor.type === 'normal') return styles.buy;
    if (order.type === 'sell' && buySellColor.type === 'normal') return styles.sell;
    if (order.type === 'buy' && buySellColor.type === 'inverse') return styles.sell;
    if (order.type === 'sell' && buySellColor.type === 'inverse') return styles.buy;
  }, [order.type, buySellColor.type]);

  const handleClick = () => {
    setTradeSlot({
      coin: order.coin,
      amount: order.sz,
      price: order.px,
      type: order.type,
    });
  }
  return (
    <div className={`${styles.orderRow} ${type}`} onClick={handleClick} >
      {hasUserOrder && <div className={styles.userOrderIndicator}></div>}
      <div className={styles.orderRowPrice}>{formatNum(order.px)}</div>
      <div className={styles.orderRowSize}>{formatNum(order.sz * coef)}</div>
      <div className={styles.orderRowTotal}>{formatNum(order.total * coef)}</div>
      <div className={styles.ratio} style={{ width: `${order.ratio * 100}%` }}></div>
      {/* <div className={styles.fadeOverlay}></div> */}
    </div>
  );
}

export default OrderRow;
