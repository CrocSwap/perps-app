import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import type { TwapSliceFillIF } from '~/utils/UserDataIFs';
import styles from './FillTwapTable.module.css';

export interface FillData {
    time: string;
    coin: string;
    direction: 'Open Long' | 'Open Short' | 'Close Long' | 'Close Short';
    price: string;
    size: string;
    tradeValue: string;
    fee: string;
    closedPnl: string;
}

interface FillTwapTableRowProps {
    fill: TwapSliceFillIF;
}

export default function FillTwapTableRow(props: FillTwapTableRowProps) {
    const { fill } = props;

    const { formatNum } = useNumFormatter();

    const { getBsColor } = useAppSettings();

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.timeCell}`}>
                {formatTimestamp(fill.time)}
            </div>
            <div className={`${styles.cell} ${styles.coinCell}`}>
                {fill.coin}
            </div>
            <div
                className={`${styles.cell} ${styles.directionCell}`}
                style={{
                    color:
                        fill.side === 'buy'
                            ? getBsColor().buy
                            : getBsColor().sell,
                }}
            >
                {fill.dir}
            </div>
            <div className={`${styles.cell} ${styles.priceCell}`}>
                {formatNum(fill.px)}
            </div>
            <div className={`${styles.cell} ${styles.sizeCell}`}>
                {formatNum(fill.sz)} {fill.coin}
            </div>
            <div className={`${styles.cell} ${styles.tradeValueCell}`}>
                {formatNum(fill.px * fill.sz, 2, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.feeCell}`}>
                {formatNum(fill.fee, 2)}
            </div>
            <div className={`${styles.cell} ${styles.closedPnlCell}`}>
                {formatNum(fill.closedPnl - fill.fee, 2, true, true)}
            </div>
        </div>
    );
}
