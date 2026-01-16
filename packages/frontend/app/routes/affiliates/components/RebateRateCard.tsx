import styles from '../affiliates.module.css';

interface RebateRateCardProps {
    rebateRate: string;
    referredByCode: string;
    rebatesEarned: string;
}

export function RebateRateCard({
    rebateRate,
    referredByCode,
    rebatesEarned,
}: RebateRateCardProps) {
    return (
        <div className={styles['rebate-card']}>
            <div className={styles['rebate-card-header']}>
                <span className={styles['rebate-card-title']}>
                    Your Rebate Rate
                </span>
                <span className={styles['rebate-card-value']}>
                    {rebateRate}
                </span>
            </div>
            <div className={styles['rebate-card-details']}>
                <div className={styles['rebate-detail-row']}>
                    <span className={styles['rebate-detail-label']}>
                        Referred by
                    </span>
                    <span className={styles['rebate-detail-value']}>
                        {referredByCode}
                    </span>
                </div>
                <div className={styles['rebate-detail-row']}>
                    <span className={styles['rebate-detail-label']}>
                        Rebates earned
                    </span>
                    <span className={styles['rebate-detail-value']}>
                        ${rebatesEarned}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function RebateRateCardSkeleton() {
    return (
        <div className={styles['rebate-card']}>
            <div className={styles['rebate-card-header']}>
                <span className={styles['rebate-card-title']}>
                    Your Rebate Rate
                </span>
                <div
                    className={styles.skeleton}
                    style={{ height: '2rem', width: '4rem' }}
                />
            </div>
            <div className={styles['rebate-card-details']}>
                <div className={styles['rebate-detail-row']}>
                    <span className={styles['rebate-detail-label']}>
                        Referred by
                    </span>
                    <div
                        className={styles.skeleton}
                        style={{ height: '1rem', width: '5rem' }}
                    />
                </div>
                <div className={styles['rebate-detail-row']}>
                    <span className={styles['rebate-detail-label']}>
                        Rebates earned
                    </span>
                    <div
                        className={styles.skeleton}
                        style={{ height: '1rem', width: '4rem' }}
                    />
                </div>
            </div>
        </div>
    );
}
