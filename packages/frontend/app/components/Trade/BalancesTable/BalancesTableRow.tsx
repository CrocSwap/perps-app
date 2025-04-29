import type { UserBalanceIF } from '~/utils/UserDataIFs';
import styles from './BalancesTable.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useMemo } from 'react';
import { parseNum } from '~/utils/orderbook/OrderBookUtils';
import { useAppSettings } from '~/stores/AppSettingsStore';
interface BalancesTableRowProps {
    balance: UserBalanceIF;
}

export default function BalancesTableRow(props: BalancesTableRowProps) {
    const { balance } = props;

    const { formatNum } = useNumFormatter();

    const { getBsColor } = useAppSettings();

    const getPnlString = () => {
        if (balance.entryNtl > 0 && Math.abs(balance.pnlValue) > 0) {
            return `${formatNum(balance.pnlValue, 2, true, true)} (${formatNum((balance.pnlValue / balance.entryNtl) * 100, 2)}%)`;
        }
        return '';
    };

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.coinCell}`}>
                {balance.coin}
            </div>
            <div className={`${styles.cell} ${styles.totalBalanceCell}`}>
                {formatNum(balance.total)} {balance.coin}
            </div>
            <div className={`${styles.cell} ${styles.availableBalanceCell}`}>
                {formatNum(balance.available)} {balance.coin}
            </div>
            <div className={`${styles.cell} ${styles.usdcValueCell}`}>
                {formatNum(balance.usdcValue, null, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.buyingPowerCell}`}>
                {formatNum(balance.buyingPower, null, true, true)}
            </div>
            <div
                className={`${styles.cell} ${styles.pnlCell} `}
                style={{
                    color:
                        balance.pnlValue > 0
                            ? getBsColor().buy
                            : balance.pnlValue < 0
                              ? getBsColor().sell
                              : 'var(--text1)',
                }}
            >
                {getPnlString()}
            </div>
            <div className={`${styles.cell} ${styles.contractCell}`}>
                {balance.coin}
            </div>
            <div className={`${styles.cell} ${styles.actionCell}`}>
                <button className={styles.sendButton}>Send</button>
            </div>
        </div>
    );
}
