import { useTranslation } from 'react-i18next';
import useNumFormatter from '~/hooks/useNumFormatter';
import type { UserBalanceIF } from '~/utils/UserDataIFs';
import { formatSolanaAddress, getExplorerUrl } from '~/utils/solanaUtils';
import styles from './BalancesTable.module.css';

interface BalancesTableRowProps {
    balance: UserBalanceIF;
}

export default function BalancesTableRow(props: BalancesTableRowProps) {
    const { t } = useTranslation();
    const { balance } = props;

    const { formatNum } = useNumFormatter();

    const showSendButton = false;

    return (
        <div
            className={`${styles.rowContainer} ${!showSendButton ? styles.noSendButton : ''}`}
        >
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
            <div className={`${styles.cell} ${styles.contractCell}`}>
                {balance.contractAddress ? (
                    <a
                        href={getExplorerUrl(balance.contractAddress)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={styles.contractLink}
                    >
                        {formatSolanaAddress(balance.contractAddress)}
                    </a>
                ) : (
                    '-'
                )}
            </div>
            {showSendButton && (
                <div className={`${styles.cell} ${styles.actionCell}`}>
                    <button className={styles.sendButton}>
                        {t('common.send')}
                    </button>
                </div>
            )}
        </div>
    );
}
