import React from 'react';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import { formatDateToTime } from '~/utils/orderbook/OrderBookUtils';
import styles from './ordertraderow.module.css';

interface OrderTradeRowProps {
    trade: OrderBookTradeIF;
}

const OrderTradeRow: React.FC<OrderTradeRowProps> = React.memo(({ trade }) => {
    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();

    // Get the color only once per render
    const color = trade.side === 'buy' ? getBsColor().buy : getBsColor().sell;

    return (
        <div className={styles.orderTradeRow}>
            <div className={styles.orderTradePrice} style={{ color }}>
                {formatNum(trade.px)}
            </div>
            <div className={styles.orderTradeSize}>{formatNum(trade.sz)}</div>
            <div className={styles.orderTradeTime}>
                <span>{formatDateToTime(new Date(trade.time))}</span>
                <span>
                    <LuSquareArrowOutUpRight size={13} />
                </span>
            </div>
        </div>
    );
});

export default OrderTradeRow;
