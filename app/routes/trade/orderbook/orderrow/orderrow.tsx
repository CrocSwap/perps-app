import { useEffect, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import type { OrderRowIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './orderrow.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';

interface OrderRowProps {
  order: OrderRowIF;
  coef: number;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, coef }) => {

  const { formatNum } = useNumFormatter();

  return (
    <div className={`${styles.orderRow} ${order.type === 'buy' ? styles.buy : styles.sell}`} >
      <div className={styles.orderRowPrice}>{formatNum(order.px)}</div>
      <div className={styles.orderRowSize}>{formatNum(order.sz * coef)}</div>
      <div className={styles.orderRowTotal}>{formatNum(order.total * coef)}</div>
      <div className={styles.ratio} style={{ width: `${order.ratio * 100}%` }}></div>
      {/* <div className={styles.fadeOverlay}></div> */}
    </div>
  );
}

export default OrderRow;
