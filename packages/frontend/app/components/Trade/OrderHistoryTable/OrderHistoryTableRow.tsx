import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './OrderHistoryTable.module.css';

interface OrderHistoryTableRowProps {
    order: OrderDataIF;
}

export default function OrderHistoryTableRow(props: OrderHistoryTableRowProps) {
    const { order } = props;

    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();

    const showTpSl = false;

    return (
        <div
            className={`${styles.rowContainer} ${!showTpSl ? styles.noTpSl : ''}`}
        >
            <div className={`${styles.cell} ${styles.timeCell}`}>
                {formatTimestamp(order.timestamp)}
            </div>
            <div className={`${styles.cell} ${styles.typeCell}`}>
                {order.orderType}
            </div>
            <div className={`${styles.cell} ${styles.coinCell}`}>
                {order.coin}
            </div>
            <div
                className={`${styles.cell} ${styles.directionCell}`}
                style={{
                    color:
                        order.side === 'buy'
                            ? getBsColor().buy
                            : getBsColor().sell,
                }}
            >
                {order.side === 'buy' ? 'Long' : 'Short'}
            </div>
            <div className={`${styles.cell} ${styles.sizeCell}`}>
                {order.sz ? formatNum(order.sz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.filledSizeCell}`}>
                {order.filledSz ? formatNum(order.filledSz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.orderValueCell}`}>
                {order.sz
                    ? formatNum(order.sz * order.limitPx, null, true, true)
                    : '--'}
            </div>
            <div className={`${styles.cell} ${styles.priceCell}`}>
                {order.limitPx ? formatNum(order.limitPx) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>
                {order.reduceOnly === false ? 'No' : 'Yes'}
            </div>
            <div className={`${styles.cell} ${styles.triggerConditionsCell}`}>
                {order.triggerCondition}
            </div>
            {showTpSl && (
                <div className={`${styles.cell} ${styles.tpslCell}`}>
                    {order.isTrigger ? formatNum(order.triggerPx || 0) : '--'}
                </div>
            )}
            <div className={`${styles.cell} ${styles.statusCell}`}>
                {order.status}
            </div>
            <div className={`${styles.cell} ${styles.orderIdCell}`}>
                {order.oid}
            </div>
        </div>
    );
}
