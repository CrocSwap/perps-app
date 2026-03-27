import { memo, useMemo } from 'react';
import styles from './RewardHistoryTable.module.css';
import truncString from '~/utils/functions/truncString';
import type { ClaimCheckIF } from '~/stores/ReferralStore';

interface PropsIF {
    claimChecks: ClaimCheckIF[] | null;
}

const CURRENCY_LABELS_BY_MINT: Record<string, string> = {
    fusdngghkzfwckbr5rllvrbvqvrctldh9hchjiq4jry: 'fUSD',
    usd2cze61evaf76rnbq4kppxnkil3irdzglfume3nog: 'USDC.s',
};

const formatClaimAmount = (amount: string): string => {
    try {
        const rawAmount = BigInt(amount);
        const decimals = 6;
        const divisor = BigInt(10 ** decimals);
        const wholePart = rawAmount / divisor;
        const fractionalPart = rawAmount % divisor;

        if (wholePart === BigInt(0) && rawAmount > BigInt(0)) {
            return `${rawAmount.toString()} units`;
        }

        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        const trimmed = fractionalStr.replace(/0+$/, '') || '00';
        const displayDecimals = trimmed.length < 2 ? '00' : trimmed;

        return `$${wholePart.toString()}.${displayDecimals}`;
    } catch {
        return amount;
    }
};

const formatDeadline = (deadline: number): string => {
    if (!deadline) return '—';
    return new Date(deadline * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getCurrencyLabel = (currencyMint: string): string => {
    const mappedLabel = CURRENCY_LABELS_BY_MINT[currencyMint.toLowerCase()];
    if (mappedLabel) {
        return mappedLabel;
    }
    return truncString(currencyMint, 5, 5);
};

function RewardHistoryTable(props: PropsIF) {
    const { claimChecks } = props;

    const rows = useMemo(() => claimChecks ?? [], [claimChecks]);

    return (
        <div className={styles.tableWrapper}>
            <div className={styles.headerContainer}>
                <div className={`${styles.cell} ${styles.headerCell}`}>
                    Amount
                </div>
                <div className={`${styles.cell} ${styles.headerCell}`}>
                    Currency
                </div>
                <div className={`${styles.cell} ${styles.headerCell}`}>
                    Claim by
                </div>
                <div className={`${styles.cell} ${styles.headerCell}`}>
                    Status
                </div>
            </div>

            <div className={styles.tableBody}>
                {rows.map((claim, index) => {
                    const status =
                        claim.deadline * 1000 < Date.now()
                            ? 'Expired'
                            : 'Claimable';

                    return (
                        <div
                            key={`${claim.token_id}-${claim.deadline}-${index}`}
                            className={styles.rowContainer}
                        >
                            <div
                                className={`${styles.cell} ${styles.amountCell}`}
                            >
                                {formatClaimAmount(claim.amount)}
                            </div>
                            <div className={styles.cell}>
                                {getCurrencyLabel(claim.currency)}
                            </div>
                            <div
                                className={`${styles.cell} ${styles.deadlineCell}`}
                            >
                                {formatDeadline(claim.deadline)}
                            </div>
                            <div className={styles.cell}>
                                <span
                                    className={`${styles.badge} ${
                                        status === 'Claimable'
                                            ? styles.badgeClaimable
                                            : styles.badgeExpired
                                    }`}
                                >
                                    {status}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {rows.length === 0 && (
                    <div className={styles.emptyState}>
                        No reward history yet
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(RewardHistoryTable);
