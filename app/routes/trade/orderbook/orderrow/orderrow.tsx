import { useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import type { OrderBookRowIF, OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderrow.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';

interface OrderRowProps {
  order: OrderBookRowIF;
  coef: number;
  resolution: OrderRowResolutionIF | null;
  userSlots: Set<string>;
  orderRowClickListener?: () => void;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, coef, resolution, userSlots, orderRowClickListener }) => {

  const { formatNum } = useNumFormatter();

  const { isInverseColor} = useAppSettings();

  const { setTradeSlot } = useTradeModuleStore();

  const  [clickEffect, setClickEffect] = useState(false);

  const type = useMemo(() => {
    if (order.type === 'buy' && !isInverseColor) return styles.buy;
    if (order.type === 'sell' && !isInverseColor) return styles.sell;
    if (order.type === 'buy' && isInverseColor) return styles.sell;
    if (order.type === 'sell' && isInverseColor) return styles.buy;
  }, [order.type, isInverseColor]);

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

    setClickEffect(true);
    setTimeout(() => {
      setClickEffect(false);
    }, 1000);

    if(orderRowClickListener){
      orderRowClickListener();
    }
  }
  return (
    <div className={`${styles.orderRow} ${type}`} onClick={handleClick} >
      {userSlots.has(formattedPrice) && <div className={styles.userOrderIndicator}></div>}
      <div className={styles.orderRowPrice}>{formattedPrice}</div>
      <div className={styles.orderRowSize}>{formatNum(order.sz * coef)}</div>
      <div className={styles.orderRowTotal}>{formatNum(order.total * coef)}</div>
      <div className={styles.ratio} style={{ width: `${order.ratio * 100}%` }}></div>
      {clickEffect && <div className={`${styles.clickEffect}`}></div>}
      {/* <div className={styles.fadeOverlay}></div> */}
    </div>
  );
}

export default OrderRow;
