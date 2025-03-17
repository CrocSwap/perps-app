import { useEffect, useMemo, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import type { OrderRowIF, OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderrow.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';

interface OrderRowProps {
  order: OrderRowIF;
  coef: number;
  resolution: OrderRowResolutionIF | null;
  userSlots: Set<string>;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, coef, resolution, userSlots }) => {

  const { formatNum } = useNumFormatter();

  const { buySellColor } = useAppSettings();

  const { setTradeSlot } = useTradeModuleStore();

  const type = useMemo(() => {
    if (order.type === 'buy' && buySellColor.type === 'normal') return styles.buy;
    if (order.type === 'sell' && buySellColor.type === 'normal') return styles.sell;
    if (order.type === 'buy' && buySellColor.type === 'inverse') return styles.sell;
    if (order.type === 'sell' && buySellColor.type === 'inverse') return styles.buy;
  }, [order.type, buySellColor.type]);

  const formattedPrice = useMemo(() => {
    return formatNum(order.px, resolution);
  }, [order.px, resolution]);

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
      {userSlots.has(formattedPrice) && <div className={styles.userOrderIndicator}></div>}
      <div className={styles.orderRowPrice}>{formattedPrice}</div>
      <div className={styles.orderRowSize}>{formatNum(order.sz * coef)}</div>
      <div className={styles.orderRowTotal}>{formatNum(order.total * coef)}</div>
      <div className={styles.ratio} style={{ width: `${order.ratio * 100}%` }}></div>
      {/* <div className={styles.fadeOverlay}></div> */}
    </div>
  );
}

export default OrderRow;
