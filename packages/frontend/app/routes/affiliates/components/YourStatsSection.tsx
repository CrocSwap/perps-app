import { useCallback, useMemo, useState } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { StatCard, StatCardSkeleton } from './StatCard';
import { RebateRateCard, RebateRateCardSkeleton } from './RebateRateCard';
import { AffiliateCurrentLevelCard } from './AffiliateCurrentLevelCard';
import {
    useAffiliateInviteeCount,
    useAffiliateStats,
    useUserReferrer,
    useUserPayoutMovements,
    executeAffiliateClaim,
    getAffiliateClaimErrorMessage,
    useAffiliateClaims,
} from '../hooks/useAffiliateData';
import { formatLargeNumber, formatTokenAmount } from '../utils/format-numbers';
import { getTxLink } from '~/utils/Constants';
import { useNotificationStore } from '~/stores/NotificationStore';
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
    const notificationStore = useNotificationStore();
    const { userAddress } = useUserDataStore();
    const [isClaiming, setIsClaiming] = useState(false);

    const {
        data: stats,
        isLoading,
        error,
        refetch,
    } = useAffiliateStats(userAddress || '', isConnected && !!userAddress);

    const { data: inviteeCount, isLoading: isLoadingInviteeCount } =
        useAffiliateInviteeCount(
            userAddress || '',
            isConnected && !!userAddress,
        );

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

    // Use the same API key as the referrals page to show claimable fees
    const {
        data: claimsData,
        isLoading: isClaimsLoading,
        refetch: refetchClaims,
    } = useAffiliateClaims(
        userAddress || '',
        '459f44f19dd5e3d7a8e2953fb0742ed98736abc42873b6c35c4847585c781661', // Referrals API key
        isConnected && !!userAddress,
    );

    const claimableAmount = useMemo(() => {
        if (!claimsData || claimsData.length === 0) return '$0.00';
        // Sum all claim amounts (amounts are in smallest unit, e.g., lamports or token decimals)
        const totalAmount = claimsData.reduce((sum, claim) => {
            return sum + BigInt(claim.amount);
        }, BigInt(0));
        // Convert to human-readable format (assuming 6 decimals for USDC-like tokens)
        const decimals = 6;
        const divisor = BigInt(10 ** decimals);
        const wholePart = totalAmount / divisor;
        const fractionalPart = totalAmount % divisor;
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        // Show full precision, then trim trailing zeros but keep at least 2 decimal places
        const trimmed = fractionalStr.replace(/0+$/, '') || '00';
        const displayDecimals = trimmed.length < 2 ? '00' : trimmed;
        const formatted = `${wholePart}.${displayDecimals}`;
        // If amount is less than 0.01, show raw smallest units instead
        if (wholePart === BigInt(0) && totalAmount > BigInt(0)) {
            return `${totalAmount.toString()} units`;
        }
        return `$${formatted}`;
    }, [claimsData]);

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
    const invitees = isConnected ? formatLargeNumber(inviteeCount ?? 0) : '-';
    const isInviteesLoading =
        isLoading || (isLoadingInviteeCount && inviteeCount === null);

    const hasClaimChecks = Boolean(claimsData && claimsData.length > 0);
    const isClaimDisabled = isClaimsLoading || isClaiming || !hasClaimChecks;

    const handleClaimClick = useCallback(async () => {
        if (isClaiming) {
            return;
        }

        console.log('🎁 [Affiliates Claim] Claim button clicked');

        if (!claimsData || claimsData.length === 0) {
            console.log(
                '🎁 [Affiliates Claim] No claim checks found, skipping',
            );
            return;
        }

        setIsClaiming(true);

        try {
            const successfulSignatures: string[] = [];
            let failedClaims = 0;
            let firstFailureMessage: string | null = null;

            for (const claim of claimsData) {
                try {
                    const txSignature = await executeAffiliateClaim({
                        claim,
                        sessionState,
                    });

                    successfulSignatures.push(txSignature);
                    console.log(
                        '🎁 [Affiliates Claim] Claim transaction confirmed:',
                        txSignature,
                    );
                } catch (claimError) {
                    failedClaims += 1;
                    const message = getAffiliateClaimErrorMessage(claimError);
                    if (!firstFailureMessage) {
                        firstFailureMessage = message;
                    }
                    console.error(
                        '🎁 [Affiliates Claim] Individual claim failed:',
                        claimError,
                    );
                }
            }

            const successCount = successfulSignatures.length;
            const totalClaims = claimsData.length;

            if (successCount === 0) {
                throw new Error(firstFailureMessage || 'Claim failed');
            }

            if (failedClaims === 0) {
                notificationStore.add({
                    title: 'Claim successful',
                    message:
                        successCount === 1
                            ? 'Your affiliate rewards claim has been processed.'
                            : `Processed ${successCount} affiliate reward claims.`,
                    icon: 'check',
                    removeAfter: 5000,
                    txLink:
                        successCount === 1
                            ? getTxLink(successfulSignatures[0])
                            : undefined,
                });
            } else {
                notificationStore.add({
                    title: 'Claim partially successful',
                    message: `Processed ${successCount} of ${totalClaims} claims.${firstFailureMessage ? ` Last error: ${firstFailureMessage}` : ''}`,
                    icon: 'check',
                    removeAfter: 10000,
                });
            }

            window.dispatchEvent(new CustomEvent('affiliateDataUpdate'));
            await refetchClaims();
        } catch (error) {
            console.error('🎁 [Affiliates Claim] Claim failed:', error);
            const message = getAffiliateClaimErrorMessage(error);
            notificationStore.add({
                title: 'Claim failed',
                message,
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsClaiming(false);
        }
    }, [
        claimsData,
        isClaiming,
        notificationStore,
        refetchClaims,
        sessionState,
    ]);

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
                    {isLoading || isClaimsLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.FEES_EARNED} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.FEES_EARNED}
                            value={affiliateEarnings}
                            tooltip={'Commission earned from your invitees'}
                            breakdown={{
                                claimed: '$0.00',
                                unclaimed: claimableAmount,
                            }}
                            actionButton={{
                                text: isClaiming ? 'Claiming...' : 'Claim',
                                disabled: isClaimDisabled,
                                onClick: () => {
                                    void handleClaimClick();
                                },
                            }}
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
                            tooltip={
                                'Number of invitees who are actively trading'
                            }
                        />
                    )}

                    <AffiliateCurrentLevelCard />

                    {isLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.TRADING_VOLUME} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.TRADING_VOLUME}
                            value={volumeReferred}
                            tooltip='Sum of trade volume by your invitees'
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

                    {isInviteesLoading ? (
                        <StatCardSkeleton label={STATS_LABELS.INVITEES} />
                    ) : (
                        <StatCard
                            label={STATS_LABELS.INVITEES}
                            value={invitees}
                            tooltip='Number of users who connected their wallets'
                        />
                    )}
                </div>
            )}
        </section>
    );
}
