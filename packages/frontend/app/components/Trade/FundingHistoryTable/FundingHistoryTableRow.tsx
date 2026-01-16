import { useTranslation } from 'react-i18next';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import type { UserFundingIF } from '~/utils/UserDataIFs';
import styles from './FundingHistoryTable.module.css';

interface FundingHistoryTableRowProps {
    fundingHistory: UserFundingIF;
}

export default function FundingHistoryTableRow(
    props: FundingHistoryTableRowProps,
) {
    const { t } = useTranslation();
    const { fundingHistory } = props;
    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.timeCell}`}>
                {formatTimestamp(fundingHistory.time)}
            </div>
            <div className={`${styles.cell} ${styles.coinCell}`}>
                {fundingHistory.coin}
            </div>
            <div className={`${styles.cell} ${styles.sizeCell}`}>
                {formatNum(fundingHistory.szi)} {fundingHistory.coin}
            </div>
            <div
                className={`${styles.cell} ${styles.positionSideCell}`}
                style={{
                    color:
                        fundingHistory.szi > 0
                            ? getBsColor().buy
                            : fundingHistory.szi < 0
                              ? getBsColor().sell
                              : 'var(--text-default)',
                }}
            >
                {fundingHistory.szi > 0 ? t('common.long') : t('common.short')}
            </div>
            <div
                className={`${styles.cell} ${styles.paymentCell}`}
                style={{
                    color:
                        fundingHistory.usdc > 0
                            ? getBsColor().buy
                            : fundingHistory.usdc < 0
                              ? getBsColor().sell
                              : 'var(--text-default)',
                }}
            >
                {formatNum(fundingHistory.usdc, null, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.rateCell}`}>
                {formatNum(fundingHistory.fundingRate * 100)}%
            </div>
        </div>
    );
}
