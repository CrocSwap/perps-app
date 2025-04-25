import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './OpenOrdersTable.module.css';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';

export interface OpenOrderData {
    time: string;
    type: string;
    coin: string;
    direction: 'Long' | 'Short';
    size: string;
    originalSize: string;
    orderValue: string;
    price: string;
    reduceOnly: string;
    triggerConditions: string;
    tpsl: string;
}

interface OpenOrdersTableRowProps {
    order: OrderDataIF;
    onCancel?: (time: number, coin: string) => void;
}

export default function OpenOrdersTableRow(props: OpenOrdersTableRowProps) {
    const { order, onCancel } = props;

    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();

    const handleCancel = () => {
        if (onCancel) {
            onCancel(order.timestamp, order.coin);
        }
    };

    return (
        <div className={styles.rowContainer}>
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
            <div className={`${styles.cell} ${styles.originalSizeCell}`}>
                {order.origSz ? formatNum(order.origSz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.orderValueCell}`}>
                {order.orderValue
                    ? `${formatNum(order.orderValue, 2, true, true)}`
                    : '--'}
            </div>
            <div className={`${styles.cell} ${styles.priceCell}`}>
                {formatNum(order.limitPx)}
            </div>
            <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>
                {order.reduceOnly ? 'Yes' : 'No'}
            </div>
            <div className={`${styles.cell} ${styles.triggerConditionsCell}`}>
                {order.triggerCondition}
            </div>
            <div className={`${styles.cell} ${styles.tpslCell}`}>
                {order.isTrigger ? formatNum(order.triggerPx || 0) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.cancelCell}`}>
                <button className={styles.cancelButton} onClick={handleCancel}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
