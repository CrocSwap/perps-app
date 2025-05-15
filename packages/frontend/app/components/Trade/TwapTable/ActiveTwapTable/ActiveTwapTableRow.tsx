import type { ActiveTwapIF } from '~/utils/UserDataIFs';
import styles from './ActiveTwapTable.module.css';
import {
    formatMinuteValue,
    formatTimestamp,
} from '~/utils/orderbook/OrderBookUtils';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useMemo } from 'react';
interface ActiveTwapTableRowProps {
    twap: ActiveTwapIF;
    onTerminate: (coin: string) => void;
}

export default function ActiveTwapTableRow(props: ActiveTwapTableRowProps) {
    const { twap, onTerminate } = props;

    const { formatNum } = useNumFormatter();

    const handleTerminate = () => {
        onTerminate(twap.coin);
    };

    const avgPx = useMemo(() => {
        return twap.executedNtl / twap.executedSz;
    }, [twap.executedNtl, twap.executedSz]);

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.coinCell}`}>
                {twap.coin}
            </div>
            <div className={`${styles.cell} ${styles.sizeCell}`}>
                {formatNum(twap.sz)} {twap.coin}
            </div>
            <div className={`${styles.cell} ${styles.executedSizeCell}`}>
                {formatNum(twap.executedSz)} {twap.coin}
            </div>
            <div className={`${styles.cell} ${styles.averagePriceCell}`}>
                {formatNum(avgPx)}
            </div>
            <div className={`${styles.cell} ${styles.runningTimeCell}`}>
                {formatMinuteValue(twap.minutes)}
            </div>
            <div className={`${styles.cell} ${styles.reduceOnlyCell}`}>
                {twap.reduceOnly ? 'Yes' : 'No'}
            </div>
            <div className={`${styles.cell} ${styles.creationTimeCell}`}>
                {formatTimestamp(twap.timestamp)}
            </div>
            <div className={`${styles.cell} ${styles.terminateCell}`}>
                <button
                    className={styles.terminateButton}
                    onClick={handleTerminate}
                >
                    Terminate
                </button>
            </div>
        </div>
    );
}
