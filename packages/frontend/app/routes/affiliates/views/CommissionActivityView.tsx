import { useMemo } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { IoReceipt, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useState } from 'react';
import { ConnectWalletCard } from '../components/ConnectWalletCard';
import { TableErrorState } from '../components/TableErrorState';
import { ViewLayout } from '../components/ViewLayout';
import { EmptyState } from '../components/EmptyState';
import { useUserPayoutMovements } from '../hooks/useAffiliateData';
import { formatTokenAmount } from '../utils/format-numbers';
import { useUserDataStore } from '~/stores/UserDataStore';
import styles from '../affiliates.module.css';

interface CommissionActivityEntry {
    id: string;
    date: string;
    conversion: string;
    amount: number;
    currencyAddress: string | null;
    chainId: number | null;
    status: string;
    statusDetails?: string | null;
}

export function CommissionActivityView() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const {
        data: payoutMovementsData,
        isLoading,
        error,
        refetch,
    } = useUserPayoutMovements(userAddress ?? '', isConnected && !!userAddress);

    const data: CommissionActivityEntry[] = useMemo(() => {
        if (!payoutMovementsData?.results) return [];

        return payoutMovementsData.results.map((movement, index) => ({
            id: `${movement.conversion_id}-${index}`,
            date: movement.date,
            conversion: movement.conversion_name,
            amount: Number(movement.total_amount),
            currencyAddress: movement.currency_address,
            chainId: movement.chain_id,
            status: movement.payout_status,
            statusDetails: movement.payout_status_details,
        }));
    }, [payoutMovementsData]);

    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = data.slice(startIndex, endIndex);

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'paid':
                return styles['badge-success'];
            case 'pending':
                return styles['badge-pending'];
            default:
                return styles['badge-error'];
        }
    };

    if (!isConnected) {
        return (
            <ViewLayout title='Commission Activity'>
                <ConnectWalletCard
                    title='Connect to view commission activity'
                    description='Sign in to see your earnings history and reward transactions'
                />
            </ViewLayout>
        );
    }

    if (isLoading) {
        return (
            <ViewLayout title='Commission Activity'>
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
            <ViewLayout title='Commission Activity'>
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
        <ViewLayout title='Commission Activity'>
            <div className={styles['table-container']}>
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead className={styles['table-header']}>
                            <tr>
                                <th className={styles['table-header-cell']}>
                                    Date
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Type
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Status
                                </th>
                                <th
                                    className={styles['table-header-cell']}
                                    style={{ textAlign: 'right' }}
                                >
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hasNoData &&
                                currentData.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className={styles['table-row']}
                                    >
                                        <td className={styles['table-cell']}>
                                            {new Date(
                                                entry.date,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className={styles['table-cell']}>
                                            {entry.conversion}
                                        </td>
                                        <td className={styles['table-cell']}>
                                            <span
                                                className={`${styles.badge} ${getStatusBadgeClass(entry.status)}`}
                                            >
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td
                                            className={styles['table-cell']}
                                            style={{
                                                textAlign: 'right',
                                                color: 'var(--aff-positive)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            $
                                            {formatTokenAmount(entry.amount, 6)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {hasNoData && (
                    <EmptyState
                        icon={IoReceipt}
                        title='No commission activity yet'
                        description='Your commission earnings will appear here once you start earning'
                    />
                )}

                {!hasNoData && (
                    <div className={styles.pagination}>
                        <span className={styles['pagination-info']}>
                            {startIndex + 1}-{Math.min(endIndex, data.length)}{' '}
                            of {data.length}
                        </span>
                        <div className={styles['pagination-controls']}>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(1, prev - 1),
                                    )
                                }
                                disabled={currentPage === 1}
                                className={styles['pagination-button']}
                            >
                                <IoChevronBack size={16} />
                            </button>
                            <span className={styles['pagination-info']}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(totalPages, prev + 1),
                                    )
                                }
                                disabled={currentPage >= totalPages}
                                className={styles['pagination-button']}
                            >
                                <IoChevronForward size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ViewLayout>
    );
}
