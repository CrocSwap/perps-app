import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './OrderHistoryTable.module.css';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface OrderHistoryTableRowProps {
    order: OrderDataIF;
}

export default function OrderHistoryTableRow(props: OrderHistoryTableRowProps) {
    const { order } = props;

    const { t, i18n } = useTranslation();

    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();

    const showTpSl = false;

    const status = useMemo(() => {
        switch (order.status.toLowerCase()) {
            case 'filled':
                return t('transactions.filled');
            case 'open':
                return t('transactions.open');
            case 'partially filled':
                return t('transactions.partiallyFilled');
            case 'partial':
                return t('transactions.partiallyFilled');
            case 'canceled':
                return t('transactions.canceled');
            case 'pending':
                return t('transactions.pending');
            default:
                return order.status;
        }
    }, [order.status, i18n.language]);

    return (
        <div
            className={`${styles.rowContainer} ${!showTpSl ? styles.noTpSl : ''}`}
        >
            <div className={`${styles.cell} ${styles.timeCell}`}>
                {formatTimestamp(order.timestamp)}
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
            <div className={`${styles.cell} ${styles.filledSizeCell}`}>
                {order.filledSz ? formatNum(order.filledSz) : '--'}
            </div>
            <div className={`${styles.cell} ${styles.orderValueCell}`}>
                {order.limitPx === 0
                    ? t('transactions.market')
                    : order.sz
                      ? formatNum(order.sz * order.limitPx, null, true, true)
                      : '--'}
            </div>
            <div className={`${styles.cell} ${styles.priceCell}`}>
                {order.limitPx === 0
                    ? t('transactions.market')
                    : order.limitPx
                      ? formatNum(order.limitPx)
                      : '--'}
            </div>
            <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>
                {order.reduceOnly === false ? t('common.no') : t('common.yes')}
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
                {status}
            </div>
            <div className={`${styles.cell} ${styles.orderIdCell}`}>
                {order.oid}
            </div>
        </div>
    );
}
