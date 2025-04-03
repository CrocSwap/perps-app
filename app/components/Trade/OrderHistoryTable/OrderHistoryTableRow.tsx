import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './OrderHistoryTable.module.css';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import useNumFormatter from '~/hooks/useNumFormatter';
interface OrderHistoryTableRowProps {
  order: OrderDataIF;
}

export default function OrderHistoryTableRow(props: OrderHistoryTableRowProps) {
  const { order } = props;

  const {formatNum} = useNumFormatter();
  const {isInverseColor} = useAppSettings();

  const getDirectionClass = (side: string) => {
    if(side === 'buy' && !isInverseColor) return styles.longDirection;
    if(side === 'buy' && isInverseColor) return styles.shortDirection;
    if(side === 'sell' && !isInverseColor) return styles.shortDirection;
    if(side === 'sell' && isInverseColor) return styles.longDirection;
  }


  return (
    <div className={styles.rowContainer}>
      <div className={`${styles.cell} ${styles.timeCell}`}>{formatTimestamp(order.timestamp)}</div>
      <div className={`${styles.cell} ${styles.typeCell}`}>{order.orderType}</div>
      <div className={`${styles.cell} ${styles.coinCell}`}>{order.coin}</div>
      <div className={`${styles.cell} ${styles.directionCell} ${getDirectionClass(order.side)}`}>
        {order.side === 'buy' ? 'Long' : 'Short'}
      </div>
      <div className={`${styles.cell} ${styles.sizeCell}`}>{order.sz ? formatNum(order.sz) : '--'}</div>
      <div className={`${styles.cell} ${styles.filledSizeCell}`}>{order.filledSz ? formatNum(order.filledSz) : '--'}</div>
      <div className={`${styles.cell} ${styles.orderValueCell}`}>{order.sz ? formatNum(order.sz * order.limitPx) : '--'}</div>
      <div className={`${styles.cell} ${styles.priceCell}`}>{order.limitPx ? formatNum(order.limitPx) : '--'}</div>
      <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>{order.reduceOnly}</div>
      <div className={`${styles.cell} ${styles.triggerConditionsCell}`}>{order.triggerCondition}</div>
      <div className={`${styles.cell} ${styles.tpslCell}`}>{order.isTrigger ? formatNum(order.triggerPx || 0) : '--'}</div>
      <div className={`${styles.cell} ${styles.statusCell}`}>{order.status}</div>
      <div className={`${styles.cell} ${styles.orderIdCell}`}>{order.oid}</div>
    </div>
  );
}