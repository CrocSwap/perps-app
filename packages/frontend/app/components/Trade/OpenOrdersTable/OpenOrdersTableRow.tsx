import { useState } from 'react';
import { LuPen } from 'react-icons/lu';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { blockExplorer } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getDurationSegment';
import packageJson from '../../../../package.json';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './OpenOrdersTable.module.css';
import { toast } from 'sonner';
import Notification from '~/components/Notifications/Notification';

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
    const { executeCancelOrder } = useCancelOrderService();
    const [isCancelling, setIsCancelling] = useState(false);

    const markPx = useTradeDataStore((state) => state.symbolInfo?.markPx || 1);

    const showTpSl = false;

    const handleCancel = async () => {
        // ID to allow all notifications within the same toast
        const toastId: string = crypto.randomUUID();

        if (!order.oid) {
            toast.custom(
                (t) => (
                    <Notification
                        data={{
                            slug: 6768767673,
                            title: 'Cancel Failed',
                            message: 'Order ID not found',
                            icon: 'error',
                        }}
                        dismiss={() => toast.dismiss(t)}
                    />
                ),
                { id: toastId },
            );
            return;
        }

        setIsCancelling(true);

        try {
            const usdValueOfOrderStr = formatNum(
                order.sz * markPx,
                2,
                true,
                true,
            );
            // Show pending notification
            toast.custom(
                (t) => (
                    <Notification
                        data={{
                            slug: 67698767673,
                            title: 'Cancel Order Pending',
                            message: `Cancelling order for ${usdValueOfOrderStr} of ${order.coin}`,
                            icon: 'spinner',
                            removeAfter: 60000,
                        }}
                        dismiss={() => toast.dismiss(t)}
                    />
                ),
                { id: toastId },
            );

            const timeOfTxBuildStart = Date.now();
            // Execute the cancel order
            const result = await executeCancelOrder({
                orderId: order.oid,
            });

            if (result.success) {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Cancel Success',
                            orderType: 'Limit',
                            direction: order.side === 'buy' ? 'Buy' : 'Sell',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show success notification
                toast.custom(
                    (t) => (
                        <Notification
                            data={{
                                slug: 6768767673,
                                title: 'Order Cancelled',
                                message: `Successfully cancelled order for ${usdValueOfOrderStr} of ${order.coin}`,
                                icon: 'check',
                                txLink: result.signature
                                    ? `${blockExplorer}/tx/${result.signature}`
                                    : undefined,
                                removeAfter: 5000,
                            }}
                            dismiss={() => toast.dismiss(t)}
                        />
                    ),
                    { id: toastId },
                );
                // Call the original onCancel callback if provided
                if (onCancel) {
                    onCancel(order.timestamp, order.coin);
                }
            } else {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Cancel Fail',
                            orderType: 'Limit',
                            direction: order.side === 'buy' ? 'Buy' : 'Sell',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show error notification
                toast.custom(
                    (t) => (
                        <Notification
                            data={{
                                slug: 971235468,
                                title: 'Cancel Failed',
                                message: String(
                                    result.error || 'Failed to cancel order',
                                ),
                                icon: 'error',
                                txLink: result.signature
                                    ? `${blockExplorer}/tx/${result.signature}`
                                    : undefined,
                                removeAfter: 5000,
                            }}
                            dismiss={() => toast.dismiss(t)}
                        />
                    ),
                    { id: toastId },
                );
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            toast.custom(
                (t) => (
                    <Notification
                        data={{
                            slug: 971235468,
                            title: 'Cancel Failed',
                            message:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error occurred',
                            icon: 'error',
                        }}
                        dismiss={() => toast.dismiss(t)}
                    />
                ),
                { id: toastId },
            );
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
