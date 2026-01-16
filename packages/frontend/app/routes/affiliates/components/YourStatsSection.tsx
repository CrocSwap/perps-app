import { useMemo } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { StatCard, StatCardSkeleton } from './StatCard';
import { RebateRateCard, RebateRateCardSkeleton } from './RebateRateCard';
import { AffiliateCurrentLevelCard } from './AffiliateCurrentLevelCard';
import {
    useAffiliateStats,
    useUserReferrer,
    useUserPayoutMovements,
} from '../hooks/useAffiliateData';
import { formatLargeNumber, formatTokenAmount } from '../utils/format-numbers';
import { useUserDataStore } from '~/stores/UserDataStore';
import styles from '../affiliates.module.css';

const STATS_LABELS = {
    FEES_EARNED: 'Fees earned',
    ACTIVE_TRADERS: 'Active traders',
    TRADING_VOLUME: 'Trading Volume',
    NEW_TRADERS: 'New Traders',
    INVITEES: 'Invitees',
};

export function YourStatsSection() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();

    const {
        data: stats,
        isLoading,
        error,
        refetch,
    } = useAffiliateStats(userAddress || '', isConnected && !!userAddress);

    const { data: referrerData } = useUserReferrer(
        userAddress || '',
        isConnected && !!userAddress,
    );

    const userRebateRate = useMemo(() => {
        if (!referrerData) {
            return null;
        }
        return referrerData.referrer_user_rebate_rate ?? null;
    }, [referrerData]);

    const { data: payoutMovements } = useUserPayoutMovements(
        userAddress || '',
        isConnected && !!userAddress,
    );

    const endUserMovements = useMemo(
        () =>
            payoutMovements?.results?.filter(
                (movement) => !movement.is_referrer,
            ) ?? [],
        [payoutMovements],
    );

    const rebatesEarned = useMemo(() => {
        return endUserMovements.reduce((sum, movement) => {
            const amount = Number(
                formatTokenAmount(Number(movement.total_amount), 6).replace(
                    /,/g,
                    '',
                ),
            );
            return sum + amount;
        }, 0);
    }, [endUserMovements]);

    const getUSDAmount = (
        earnings:
            | Array<{ amount: number; currency: string }>
            | null
            | undefined,
    ): number | null => {
        if (!earnings || earnings.length === 0) return null;
        const usdEarning = earnings.find((e) => e.currency === 'USD');
        return usdEarning?.amount ?? null;
    };

    const affiliateEarnings = isConnected
        ? `$${formatLargeNumber(getUSDAmount(stats?.total_earnings) ?? 0)}`
        : '-';
    const volumeReferred = isConnected
        ? stats?.referred_volume !== null &&
          stats?.referred_volume !== undefined
            ? `$${formatLargeNumber(stats.referred_volume)}`
            : '-'
        : '-';
    const newTraders = isConnected
        ? formatLargeNumber(stats?.newTraders ?? 0)
        : '-';
    const activeTraders = isConnected
        ? formatLargeNumber(stats?.activeTraders ?? 0)
        : '-';
    const invitees = isConnected
        ? formatLargeNumber(stats?.referred_users ?? 0)
        : '-';

    return (
        <section
            className={styles.section}
            style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
        >
            <h2 className={styles['section-title']}>Overview</h2>

            {error ? (
                <div
                    className={styles['glass-card']}
                    style={{ textAlign: 'center' }}
                >
                    <p
                        style={{
                            color: 'var(--aff-negative)',
                            marginBottom: '1rem',
                        }}
                    >
                        {error.message || 'An error occurred'}
                    </p>
                    <button
                        className={`${styles.btn} ${styles['btn-secondary']}`}
                        onClick={() => refetch()}
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className={styles['stats-grid']}>
                    {isLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.FEES_EARNED} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.FEES_EARNED}
                            value={affiliateEarnings}
                        />
                    )}

                    {isLoading ? (
                        <RebateRateCardSkeleton />
                    ) : (
                        <RebateRateCard
                            rebateRate={
                                userRebateRate !== null
                                    ? `${(userRebateRate * 100).toFixed(0)}%`
                                    : '-'
                            }
                            referredByCode={referrerData?.referrer_code ?? '-'}
                            rebatesEarned={formatLargeNumber(rebatesEarned)}
                        />
                    )}

                    {isLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.ACTIVE_TRADERS} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.ACTIVE_TRADERS}
                            value={activeTraders}
                            tooltip='Active Invitee who made at least one trade in the last 30 days'
                        />
                    )}

                    <AffiliateCurrentLevelCard />

                    {isLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.TRADING_VOLUME} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.TRADING_VOLUME}
                            value={volumeReferred}
                            tooltip='Invitees Trading Volume'
                        />
                    )}

                    {isLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.NEW_TRADERS} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.NEW_TRADERS}
                            value={newTraders}
                            tooltip='Number of invitees who made their first trade'
                        />
                    )}

                    {isLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.INVITEES} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.INVITEES}
                            value={invitees}
                            tooltip='Number of users who joined the affiliate program with your code.'
                        />
                    )}
                </div>
            )}
        </section>
    );
}
