import { useState } from 'react';
import { LuPen } from 'react-icons/lu';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { blockExplorer } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './OpenOrdersTable.module.css';

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
    const notifications = useNotificationStore();
    const { executeCancelOrder } = useCancelOrderService();
    const [isCancelling, setIsCancelling] = useState(false);

    const markPx = useTradeDataStore((state) => state.symbolInfo?.markPx || 1);

    const showTpSl = false;

    const handleCancel = async () => {
        if (!order.oid) {
            notifications.add({
                title: 'Cancel Failed',
                message: 'Order ID not found',
                icon: 'error',
            });
            return;
        }

        setIsCancelling(true);

        try {
            // Show pending notification
            // notifications.add({
            //     title: 'Cancel Order Pending',
            //     message: `Cancelling order for ${order.sz} ${order.coin}`,
            //     icon: 'spinner',
            // });

            // Execute the cancel order
            const result = await executeCancelOrder({
                orderId: order.oid,
            });

            const usdValueOfOrderStr = formatNum(
                order.sz * markPx,
                2,
                true,
                true,
            );

            if (result.success) {
                // Show success notification
                notifications.add({
                    title: 'Order Cancelled',
                    message: `Successfully cancelled order for ${usdValueOfOrderStr} of ${order.coin}`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });

                // Call the original onCancel callback if provided
                if (onCancel) {
                    onCancel(order.timestamp, order.coin);
                }
            } else {
                // Show error notification
                notifications.add({
                    title: 'Cancel Failed',
                    message: String(result.error || 'Failed to cancel order'),
                    icon: 'error',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            notifications.add({
                title: 'Cancel Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
            });
        } finally {
            setIsCancelling(false);
        }
    };

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
            <div className={`${styles.cell} ${styles.originalSizeCell}`}>
                {order.origSz ? formatNum(order.origSz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.orderValueCell}`}>
                {order.limitPx === 0
                    ? 'Market'
                    : order.orderValue
                      ? `${formatNum(order.orderValue, 2, true, true)}`
                      : '--'}
            </div>
            <div className={`${styles.cell} ${styles.priceCell}`}>
                {order.limitPx === 0 ? 'Market' : formatNum(order.limitPx)}
            </div>
            <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>
                {order.reduceOnly ? 'Yes' : 'No'}
            </div>
            <div className={`${styles.cell} ${styles.triggerConditionsCell}`}>
                {order.triggerCondition}
            </div>
            {showTpSl && (
                <div className={`${styles.cell} ${styles.tpslCell}`}>
                    {order.isTrigger ? formatNum(order.triggerPx || 0) : '--'}
                    <button>
                        <LuPen color='var(--text1)' size={10} />
                    </button>
                </div>
            )}
            <div className={`${styles.cell} ${styles.cancelCell}`}>
                <button
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={isCancelling}
                >
                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                </button>
            </div>
        </div>
    );
}
