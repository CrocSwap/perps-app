import { useState } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import {
    IoLink,
    IoAdd,
    IoEllipsisVertical,
    IoCopy,
    IoCreate,
} from 'react-icons/io5';
import { ConnectWalletCard } from '../components/ConnectWalletCard';
import { TableErrorState } from '../components/TableErrorState';
import { ViewLayout } from '../components/ViewLayout';
import { EmptyState } from '../components/EmptyState';
import {
    useAffiliateCode,
    useAffiliateAudience,
} from '../hooks/useAffiliateData';
import { formatUSD } from '../utils/format-numbers';
import { getCommissionByAudienceId } from '../utils/affiliate-levels';
import { useUserDataStore } from '~/stores/UserDataStore';
import styles from '../affiliates.module.css';

export function LinksView() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    const { data: audienceData } = useAffiliateAudience(
        userAddress || '',
        isConnected && !!userAddress,
    );

    const {
        data: affiliateCode,
        isLoading,
        error,
        refetch,
    } = useAffiliateCode(userAddress || '', isConnected && !!userAddress);

    const audienceId = audienceData?.audiences?.results?.[0]?.id;
    const levelCommission = audienceId
        ? (getCommissionByAudienceId(audienceId) ?? 0.2)
        : 0.2;
    const commissionRatePercent = levelCommission * 100;

    const userRebateRate = affiliateCode?.user_rebate_rate ?? 0;
    const inviteePercent = userRebateRate * 100;
    const youPercent = commissionRatePercent - inviteePercent;

    const data = affiliateCode
        ? [
              {
                  code: affiliateCode.code,
                  created_at: affiliateCode.created_at,
                  clicks: affiliateCode.clicks,
                  total_users: affiliateCode.total_users,
                  total_earnings: affiliateCode.total_earnings,
                  you_percentage: youPercent,
                  invitee_percentage: inviteePercent,
              },
          ]
        : [];

    const copyToClipboard = (code: string) => {
        const referralUrl = `https://perps.ambient.finance?ref=${code}`;
        navigator.clipboard.writeText(referralUrl);
        setDropdownOpen(null);
    };

    if (!isConnected) {
        return (
            <ViewLayout title='Links'>
                <ConnectWalletCard
                    title='Connect to view your links'
                    description='Sign in to track your referral link performance and analytics'
                />
            </ViewLayout>
        );
    }

    if (isLoading) {
        return (
            <ViewLayout title='Links'>
                <div className={styles['table-container']}>
                    <div className={styles['page-loader']}>
                        <div className={styles.loader} />
                    </div>
                </div>
            </ViewLayout>
        );
    }

    if (error) {
        return (
            <ViewLayout title='Links'>
                <TableErrorState
                    error={
                        error instanceof Error
                            ? error.message
                            : 'An error occurred'
                    }
                    onRetry={refetch}
                />
            </ViewLayout>
        );
    }

    const hasNoData = data.length === 0;

    return (
        <ViewLayout title='Links'>
            <div className={styles['table-container']}>
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead className={styles['table-header']}>
                            <tr>
                                <th className={styles['table-header-cell']}>
                                    Code
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Date Created
                                </th>
                                <th className={styles['table-header-cell']}>
                                    <div>Commission Rate</div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 'normal',
                                            color: 'var(--aff-text-muted)',
                                        }}
                                    >
                                        (You/Invitee)
                                    </div>
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Clicks
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Total Users
                                </th>
                                <th
                                    className={styles['table-header-cell']}
                                    style={{ textAlign: 'right' }}
                                >
                                    Total Earnings
                                </th>
                                <th
                                    className={styles['table-header-cell']}
                                    style={{ width: '60px' }}
                                ></th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hasNoData &&
                                data.map((entry) => (
                                    <tr
                                        key={entry.code}
                                        className={styles['table-row']}
                                    >
                                        <td
                                            className={styles['table-cell']}
                                            style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {entry.code}
                                        </td>
                                        <td className={styles['table-cell']}>
                                            {new Date(
                                                entry.created_at,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className={styles['table-cell']}>
                                            {entry.you_percentage.toFixed(0)}% /{' '}
                                            {entry.invitee_percentage.toFixed(
                                                0,
                                            )}
                                            %
                                        </td>
                                        <td className={styles['table-cell']}>
                                            {entry.clicks.toLocaleString()}
                                        </td>
                                        <td className={styles['table-cell']}>
                                            {entry.total_users.toLocaleString()}
                                        </td>
                                        <td
                                            className={styles['table-cell']}
                                            style={{
                                                textAlign: 'right',
                                                color: 'var(--aff-positive)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            ${formatUSD(entry.total_earnings)}
                                        </td>
                                        <td
                                            className={styles['table-cell']}
                                            style={{ position: 'relative' }}
                                        >
                                            <button
                                                className={
                                                    styles['pagination-button']
                                                }
                                                onClick={() =>
                                                    setDropdownOpen(
                                                        dropdownOpen ===
                                                            entry.code
                                                            ? null
                                                            : entry.code,
                                                    )
                                                }
                                            >
                                                <IoEllipsisVertical size={16} />
                                            </button>
                                            {dropdownOpen === entry.code && (
                                                <div
                                                    className={
                                                        styles['dropdown-menu']
                                                    }
                                                >
                                                    <button
                                                        className={
                                                            styles[
                                                                'dropdown-item'
                                                            ]
                                                        }
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                entry.code,
                                                            )
                                                        }
                                                    >
                                                        <IoCopy size={14} />
                                                        Copy Link
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {hasNoData && (
                    <EmptyState
                        icon={IoLink}
                        title='No referral links yet'
                        description='Create your first referral link to start tracking performance'
                    />
                )}
            </div>
        </ViewLayout>
    );
}
