import { useState } from 'react';
import { LuPen } from 'react-icons/lu';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { makeSlug, useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getTxLink } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './OpenOrdersTable.module.css';
import { t } from 'i18next';

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
                title: t('transactions.cancelFailed.title'),
                message: t('transactions.cancelFailed.message'),
                icon: 'error',
            });
            return;
        }

        setIsCancelling(true);

        const slug = makeSlug(10);
        try {
            const usdValueOfOrderStr = formatNum(
                order.sz * markPx,
                2,
                true,
                true,
            );
            // Show pending notification
            notifications.add({
                title: t('transactions.cancelOrderPending.title'),
                message: t('transactions.cancelOrderPending.message', {
                    side: order.side,
                    usdValueOfOrderStr,
                    symbol: order.coin,
                }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });

            const timeOfTxBuildStart = Date.now();
            // Execute the cancel order
            const result = await executeCancelOrder({
                orderId: order.oid,
            });

            if (result.success) {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Cancel Success',
                            orderType: 'Limit',
                            success: true,
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
                notifications.add({
                    title: t('transactions.cancelOrderConfirmed.title'),
                    message: t('transactions.cancelOrderConfirmed.message', {
                        usdValueOfOrderStr,
                        symbol: order.coin,
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                    removeAfter: 5000,
                });

                // Call the original onCancel callback if provided
                if (onCancel) {
                    onCancel(order.timestamp, order.coin);
                }
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Cancel Fail',
                            orderType: 'Limit',
                            success: false,
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
                notifications.add({
                    title: t('transactions.cancelFailed.title'),
                    message: String(
                        result.error || t('transactions.cancelFailed.message2'),
                    ),
                    icon: 'error',
                    txLink: getTxLink(result.signature),
                    removeAfter: 5000,
                });
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            notifications.remove(slug);
            notifications.add({
                title: t('transactions.cancelFailed.title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
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
                <span className={styles.timestamp}>
                    {formatTimestamp(order.timestamp)}
                </span>
            </div>

            <div className={`${styles.cell} ${styles.typeCell}`}>
                {order.orderType.toLowerCase() === 'market'
                    ? t('transactions.market')
                    : order.orderType.toLowerCase() === 'limit'
                      ? t('transactions.limit')
                      : order.orderType}
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
                {order.side === 'buy' ? t('common.long') : t('common.short')}
            </div>
            <div className={`${styles.cell} ${styles.sizeCell}`}>
                {order.sz ? formatNum(order.sz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.originalSizeCell}`}>
                {order.origSz ? formatNum(order.origSz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.orderValueCell}`}>
                {order.limitPx === 0
                    ? t('transactions.market')
                    : order.orderValue
                      ? `${formatNum(order.orderValue, 2, true, true)}`
                      : '--'}
            </div>
            <div className={`${styles.cell} ${styles.priceCell}`}>
                {order.limitPx === 0
                    ? t('transactions.market')
                    : formatNum(order.limitPx)}
            </div>
            <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>
                {order.reduceOnly ? t('common.yes') : t('common.no')}
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
                    {isCancelling
                        ? t('transactions.cancelling')
                        : t('common.cancel')}
                </button>
            </div>
        </div>
    );
}
