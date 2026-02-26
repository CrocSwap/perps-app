import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import {
    IoLink,
    IoAdd,
    IoEllipsisVertical,
    IoCopy,
    IoCreate,
    IoPencil,
} from 'react-icons/io5';
import { ConnectWalletCard } from '../components/ConnectWalletCard';
import { TableErrorState } from '../components/TableErrorState';
import { ViewLayout } from '../components/ViewLayout';
import { EmptyState } from '../components/EmptyState';
import {
    useAffiliateCode,
    useAffiliateAudience,
} from '../hooks/useAffiliateData';
import { getCommissionByAudienceId } from '../utils/affiliate-levels';
import { useNumFormatter } from '~/hooks/useNumFormatter';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EditCommissionSplitModal } from '../components/EditCommissionSplit/EditCommissionSplitModal';
import { CreateReferralCodeModal } from '../components/CreateReferralCode/CreateReferralCodeModal';
import styles from '../affiliates.module.css';

export function LinksView() {
    const allowMultipleAffiliateCodes = false;
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();
    const { currency } = useNumFormatter();
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const [editingCode, setEditingCode] = useState<{
        code: string;
        currentSplit: number;
    } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                dropdownRef.current?.contains(target) ||
                toggleRef.current?.contains(target)
            ) {
                return;
            }
            setDropdownOpen(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen]);

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
        ? (getCommissionByAudienceId(audienceId) ?? null)
        : null;
    const commissionRatePercent =
        levelCommission != null ? levelCommission * 100 : null;

    const userRebateRate = affiliateCode?.user_rebate_rate ?? null;
    const inviteePercent = userRebateRate != null ? userRebateRate * 100 : null;
    const youPercent =
        commissionRatePercent != null && inviteePercent != null
            ? commissionRatePercent - inviteePercent
            : null;

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
        const referralUrl = `${window.location.origin}?af=${code}`;
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
    const hasCreatedCode = data.length > 0;
    const canCreateCode = allowMultipleAffiliateCodes || !hasCreatedCode;
    const createCodeDisabledMessage =
        'Creating multiple referral codes is currently disabled. You can only have one code per wallet.';

    return (
        <ViewLayout title='Links'>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '1rem',
                }}
            >
                <span title={!canCreateCode ? createCodeDisabledMessage : ''}>
                    <button
                        onClick={() => {
                            if (canCreateCode) {
                                setIsCreateModalOpen(true);
                            }
                        }}
                        className={styles.submitButton}
                        disabled={!canCreateCode}
                        style={{
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--accent1)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: canCreateCode ? 'pointer' : 'not-allowed',
                            opacity: canCreateCode ? 1 : 0.6,
                        }}
                    >
                        <IoAdd size={16} />
                        Create Code
                    </button>
                </span>
            </div>
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
                                            {entry.you_percentage != null &&
                                            entry.invitee_percentage != null
                                                ? `${entry.you_percentage.toFixed(0)}% / ${entry.invitee_percentage.toFixed(0)}%`
                                                : '?'}
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
                                            {currency(
                                                entry.total_earnings,
                                                true,
                                            )}
                                        </td>
                                        <td
                                            className={styles['table-cell']}
                                            style={{ position: 'relative' }}
                                        >
                                            <button
                                                ref={toggleRef}
                                                className={
                                                    styles['pagination-button']
                                                }
                                                onClick={(e) => {
                                                    if (
                                                        dropdownOpen ===
                                                        entry.code
                                                    ) {
                                                        setDropdownOpen(null);
                                                    } else {
                                                        const rect =
                                                            e.currentTarget.getBoundingClientRect();
                                                        setDropdownPos({
                                                            top:
                                                                rect.bottom + 4,
                                                            right:
                                                                window.innerWidth -
                                                                rect.right,
                                                        });
                                                        setDropdownOpen(
                                                            entry.code,
                                                        );
                                                    }
                                                }}
                                            >
                                                <IoEllipsisVertical size={16} />
                                            </button>
                                            {dropdownOpen === entry.code &&
                                                createPortal(
                                                    <div
                                                        ref={dropdownRef}
                                                        style={{
                                                            position: 'fixed',
                                                            top: dropdownPos.top,
                                                            right: dropdownPos.right,
                                                            zIndex: 9999,
                                                            background:
                                                                '#12121a',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '8px',
                                                            minWidth: '10rem',
                                                            padding: '0.25rem',
                                                            boxShadow:
                                                                '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                                        }}
                                                    >
                                                        <button
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: '0.5rem',
                                                                width: '100%',
                                                                padding:
                                                                    '0.5rem 0.75rem',
                                                                fontSize:
                                                                    '0.875rem',
                                                                color: '#f0f0f8',
                                                                background:
                                                                    'transparent',
                                                                border: 'none',
                                                                borderRadius:
                                                                    '4px',
                                                                cursor: 'pointer',
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    'rgba(255, 255, 255, 0.1)')
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    'transparent')
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
                                                        <button
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: '0.5rem',
                                                                width: '100%',
                                                                padding:
                                                                    '0.5rem 0.75rem',
                                                                fontSize:
                                                                    '0.875rem',
                                                                color: '#f0f0f8',
                                                                background:
                                                                    'transparent',
                                                                border: 'none',
                                                                borderRadius:
                                                                    '4px',
                                                                cursor: 'pointer',
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    'rgba(255, 255, 255, 0.1)')
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    'transparent')
                                                            }
                                                            onClick={() => {
                                                                setEditingCode({
                                                                    code: entry.code,
                                                                    currentSplit:
                                                                        entry.invitee_percentage,
                                                                });
                                                                setDropdownOpen(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            <IoPencil
                                                                size={14}
                                                            />
                                                            Edit Commission
                                                        </button>
                                                    </div>,
                                                    document.body,
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

                {editingCode && (
                    <EditCommissionSplitModal
                        open={true}
                        onClose={() => setEditingCode(null)}
                        onSuccess={() => refetch()}
                        code={editingCode.code}
                        currentSplit={editingCode.currentSplit}
                        commissionRate={commissionRatePercent}
                    />
                )}

                <CreateReferralCodeModal
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => refetch()}
                    commissionRate={commissionRatePercent}
                />
            </div>
        </ViewLayout>
    );
}
