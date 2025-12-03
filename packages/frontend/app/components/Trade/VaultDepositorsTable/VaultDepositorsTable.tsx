import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import {
    sortVaultDepositors,
    type VaultDepositorSortBy,
    type VaultFollowerStateIF,
} from '~/utils/VaultIFs';
import VaultDepositorsTableHeader from './VaultDepositorsTableHeader';
import VaultDepositorsTableRow from './VaultDepositorsTableRow';

interface VaultDepositorTableProps {
    data: VaultFollowerStateIF[];
    isFetched: boolean;
}

export default function VaultDepositorsTable(props: VaultDepositorTableProps) {
    const { data, isFetched } = props;

    return (
        <>
            <GenericTable
                storageKey='VaultDepositorsTable'
                data={data}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <VaultDepositorsTableHeader
                        sortBy={sortBy as VaultDepositorSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(depositor, index) => (
                    <VaultDepositorsTableRow
                        key={`depositor-${index}`}
                        depositor={depositor}
                    />
                )}
                sorterMethod={sortVaultDepositors}
                pageMode={false}
                isFetched={isFetched}
                viewAllLink={''}
                skeletonRows={7}
                skeletonColRatios={[1, 0.8, 0.8, 0.8, 0.8]}
                defaultSortBy={'vaultEquity'}
                defaultSortDirection={'desc'}
                slicedLimit={100}
                heightOverride={'30vh'}
            />
        </>
    );
}
