import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { DepositAndWithDrawalSortBy } from '~/utils/UserDataIFs';
import DepositsWithdrawalsTableHeader from './DepositsWithdrawalsTableHeader';
import DepositsWithdrawalsTableRow, {
    type TransactionData,
} from './DepositsWithdrawalsTableRow';

function sortTransactionData(
    data: TransactionData[],
    sortBy: DepositAndWithDrawalSortBy,
    sortDirection: TableSortDirection,
): TransactionData[] {
    const copy = [...data];
    if (!sortBy || !sortDirection) return copy;

    const getKey = (tx: TransactionData): string | number => {
        const d = tx.delta as any;
        switch (sortBy) {
            case 'time':
                return tx.time;
            case 'status':
                return 'Completed';
            case 'network':
                return d.token || '';
            case 'action':
                return d.type;
            case 'valueChange':
                return parseFloat(d.amount || d.usdc || '0');
            case 'fee':
                return parseFloat(d.nativeTokenFee || d.fee || '0');
            default:
                return '';
        }
    };

    copy.sort((a, b) => {
        const aKey = getKey(a),
            bKey = getKey(b);
        if (typeof aKey === 'number' && typeof bKey === 'number') {
            return sortDirection === 'asc' ? aKey - bKey : bKey - aKey;
        }
        return sortDirection === 'asc'
            ? String(aKey).localeCompare(String(bKey))
            : String(bKey).localeCompare(String(aKey));
    });

    return copy;
}

interface DepositsWithdrawalsTableProps {
    isFetched: boolean;
    pageMode?: boolean;
    data?: TransactionData[];
}

export default function DepositsWithdrawalsTable(
    props: DepositsWithdrawalsTableProps,
) {
    const { isFetched, pageMode } = props;
    const transactions = useTradeDataStore(
        (s) => s.userNonFundingLedgerUpdates,
    );

    const sortedTxs = useMemo(
        () => [...transactions].sort((a, b) => b.time - a.time),
        [transactions],
    );

    const { debugWallet } = useDebugStore();
    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const viewAllLink = debugWallet.address
        ? `/depositsandwithdrawals/${debugWallet.address}`
        : '/depositsandwithdrawals';

    return (
        <GenericTable<TransactionData, DepositAndWithDrawalSortBy>
            storageKey={`DepositsWithdrawalsTable_${currentUserRef.current}`}
            data={sortedTxs}
            renderHeader={(dir, onSort, by) => (
                <DepositsWithdrawalsTableHeader
                    sortBy={by}
                    sortDirection={dir}
                    sortClickHandler={onSort}
                />
            )}
            renderRow={(tx, idx) => (
                <DepositsWithdrawalsTableRow
                    key={`tx-${idx}`}
                    transaction={tx}
                />
            )}
            sorterMethod={sortTransactionData}
            isFetched={isFetched}
            pageMode={pageMode}
            viewAllLink={viewAllLink}
            skeletonRows={7}
            skeletonColRatios={[2, 1, 1, 1, 1, 1, 1, 1]}
            defaultSortBy='time'
            defaultSortDirection='desc'
        />
    );
}
