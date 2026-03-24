import { useState } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import {
    IoSearch,
    IoChevronBack,
    IoChevronForward,
    IoPeople,
} from 'react-icons/io5';
import { ConnectWalletCard } from '../components/ConnectWalletCard';
import { TableErrorState } from '../components/TableErrorState';
import { ViewLayout } from '../components/ViewLayout';
import { EmptyState } from '../components/EmptyState';
import { usePayoutsByReferrer } from '../hooks/useAffiliateData';
import {
    maskUserAddress,
    formatLargeNumber,
    formatTokenAmount,
} from '../utils/format-numbers';
import { useUserDataStore } from '~/stores/UserDataStore';
import styles from '../affiliates.module.css';

export function ReferredUsersView() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error, refetch } = usePayoutsByReferrer(
        userAddress || '',
        isConnected && !!userAddress,
    );

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const filteredData = (data || []).filter((entry) => {
        const userId = Object.keys(entry)[0].toLowerCase();
        return userId.includes(searchQuery.toLowerCase());
    });

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    if (!isConnected) {
        return (
            <ViewLayout title='Affiliate History'>
                <ConnectWalletCard
                    title='Connect to view referred users'
                    description="Sign in to see users you've referred and their activity"
                />
            </ViewLayout>
        );
    }

    if (isLoading) {
        return (
            <ViewLayout title='Affiliate History'>
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
            <ViewLayout title='Affiliate History'>
                <TableErrorState
                    error={
                        error instanceof Error
                            ? error.message
                            : 'An error occurred'
                    }
                    onRetry={() => refetch()}
                />
            </ViewLayout>
        );
    }

    const hasNoData = !data || data.length === 0;

    return (
        <ViewLayout title='Affiliate History'>
            <div className={styles['table-container']}>
                {/* Search Input */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--aff-border-default)',
                    }}
                >
                    <div className={styles['search-container']}>
                        <IoSearch className={styles['search-icon']} />
                        <input
                            type='text'
                            placeholder='Search by user address...'
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={styles['search-input']}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead className={styles['table-header']}>
                            <tr>
                                <th className={styles['table-header-cell']}>
                                    User
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Date Joined
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Rebate Rate
                                </th>
                                <th className={styles['table-header-cell']}>
                                    Volume
                                </th>
                                <th
                                    className={styles['table-header-cell']}
                                    style={{ textAlign: 'right' }}
                                >
                                    Earnings
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hasNoData &&
                                currentData.map((entry, index) => {
                                    const userId = Object.keys(entry)[0];
                                    const userData = entry[userId];
                                    const usdEarning = userData.earnings?.find(
                                        (e) => e.currency?.address === null,
                                    );
                                    const earningsAmount =
                                        usdEarning?.amount ?? 0;

                                    return (
                                        <tr
                                            key={index}
                                            className={styles['table-row']}
                                        >
                                            <td
                                                className={styles['table-cell']}
                                                style={{
                                                    fontFamily: 'monospace',
                                                }}
                                            >
                                                {maskUserAddress(userId)}
                                            </td>
                                            <td
                                                className={styles['table-cell']}
                                            >
                                                {new Date(
                                                    userData.dateJoined,
                                                ).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td
                                                className={styles['table-cell']}
                                            >
                                                {userData.rebateRate.toFixed(0)}
                                                %
                                            </td>
                                            <td
                                                className={styles['table-cell']}
                                            >
                                                $
                                                {formatLargeNumber(
                                                    userData.volume,
                                                )}
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
                                                {formatLargeNumber(
                                                    earningsAmount,
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {hasNoData && (
                    <EmptyState
                        icon={IoPeople}
                        title='No referred users yet'
                        description='Start referring users to see their activity and earnings here'
                    />
                )}

                {!hasNoData && filteredData.length === 0 && (
                    <div className={styles['empty-state']}>
                        <IoSearch className={styles['empty-state-icon']} />
                        <p
                            style={{
                                color: 'var(--aff-text-muted)',
                                fontSize: '0.875rem',
                            }}
                        >
                            No users found matching "{searchQuery}"
                        </p>
                    </div>
                )}

                {!hasNoData && (
                    <div className={styles.pagination}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                            }}
                        >
                            <span className={styles['pagination-info']}>
                                {startIndex + 1}-
                                {Math.min(endIndex, filteredData.length)} of{' '}
                                {filteredData.length}
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) =>
                                    handlePageSizeChange(Number(e.target.value))
                                }
                                className={styles.select}
                                style={{
                                    width: 'auto',
                                    padding: '0.25rem 0.5rem',
                                }}
                            >
                                {[5, 10, 15, 20, 25, 30].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles['pagination-controls']}>
                            <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className={styles['pagination-button']}
                            >
                                <IoChevronBack size={16} />
                            </button>
                            <span className={styles['pagination-info']}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
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
