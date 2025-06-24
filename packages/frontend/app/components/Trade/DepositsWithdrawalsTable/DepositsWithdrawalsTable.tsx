import DepositsWithdrawalsTableHeader from './DepositsWithdrawalsTableHeader';
import DepositsWithdrawalsTableRow from './DepositsWithdrawalsTableRow';
//import { transactionsData } from './data';
import styles from './DepositsWithdrawalsTable.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useTradeDataStore } from '~/stores/TradeDataStore';
export default function DepositsWithdrawalsTable() {
    const transactions = useTradeDataStore(
        (state) => state.userNonFundingLedgerUpdates,
    );
    const handleViewAll = () => {
        console.log('View all transactions');
    };

    const handleExportCSV = () => {
        console.log('Export as CSV');
    };

    const sortedTxs = useMemo(
        () => [...transactions].sort((a, b) => b.time - a.time),
        [transactions],
    );

    return (
        <div className={styles.tableWrapper}>
            <DepositsWithdrawalsTableHeader />
            <div className={styles.tableBody}>
                {sortedTxs.map((transaction, index) => (
                    <DepositsWithdrawalsTableRow
                        key={`transaction-${index}`}
                        transaction={transaction}
                    />
                ))}

                {sortedTxs.length === 0 && (
                    <div
                        className={styles.rowContainer}
                        style={{ justifyContent: 'center', padding: '2rem 0' }}
                    >
                        No transactions to display
                    </div>
                )}
            </div>

            {sortedTxs.length > 0 && (
                <div className={styles.actionsContainer}>
                    <button
                        className={styles.actionLink}
                        onClick={handleViewAll}
                    >
                        View All
                    </button>
                    <button
                        className={styles.actionLink}
                        onClick={handleExportCSV}
                    >
                        Export as CSV
                    </button>
                </div>
            )}
        </div>
    );
}
