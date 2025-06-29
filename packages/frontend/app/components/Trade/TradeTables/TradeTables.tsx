import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { debugWallets, WsChannels } from '~/utils/Constants';
import BalancesTable from '../BalancesTable/BalancesTable';
import DepositsWithdrawalsTable from '../DepositsWithdrawalsTable/DepositsWithdrawalsTable';
import FilterDropdown from '../FilterDropdown/FilterDropdown';
import FundingHistoryTable from '../FundingHistoryTable/FundingHistoryTable';
import OpenOrdersTable from '../OpenOrdersTable/OpenOrdersTable';
import OrderHistoryTable from '../OrderHistoryTable/OrderHistoryTable';
import PositionsTable from '../PositionsTable/PositionsTable';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import TradeHistoryTable from '../TradeHistoryTable/TradeHistoryTable';
import TwapTable from '../TwapTable/TwapTable';
import styles from './TradeTable.module.css';
import { Pages, usePage } from '~/hooks/usePage';
import { useDebugStore } from '~/stores/DebugStore';
import VaultDepositorsTable from '../VaultDepositorsTable/VaultDepositorsTable';
import type { VaultFollowerStateIF } from '~/utils/VaultIFs';
export interface FilterOption {
    id: string;
    label: string;
}

const tradePageBlackListTabs = new Set([
    'Funding History',
    'Deposits and Withdrawals',
    'Depositors',
]);

const portfolioPageBlackListTabs = new Set(['Depositors']);

const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'long', label: 'Long' },
    { id: 'short', label: 'Short' },
];

interface TradeTableProps {
    portfolioPage?: boolean;
    vaultPage?: boolean;
    vaultFetched?: boolean;
    vaultDepositors?: VaultFollowerStateIF[];
}

export default function TradeTable(props: TradeTableProps) {
    const { portfolioPage, vaultPage, vaultFetched, vaultDepositors } = props;
    const {
        selectedTradeTab,
        setSelectedTradeTab,
        orderHistory,
        fetchedChannels,
        userFills,
        userFundings,
        userOrders,
    } = useTradeDataStore();
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [hideSmallBalances, setHideSmallBalances] = useState(false);

    const { page } = usePage();

    const { debugWallet, setDebugWallet } = useDebugStore();

    const tabs = useMemo(() => {
        if (!page) return [];

        let availableTabs = [
            'Balances',
            'Positions',
            'Open Orders',
            'TWAP',
            'Trade History',
            'Funding History',
            'Order History',
            'Deposits and Withdrawals',
        ];

        if (vaultPage) {
            availableTabs.push('Depositors');
        }

        if (page === Pages.TRADE) {
            return availableTabs.filter(
                (tab) => !tradePageBlackListTabs.has(tab),
            );
        } else if (page === Pages.PORTFOLIO) {
            return availableTabs.filter(
                (tab) => !portfolioPageBlackListTabs.has(tab),
            );
        }
        return availableTabs;
    }, [page]);

    // reset wallet on trade tables after switch back from vaults
    useEffect(() => {
        if (
            !vaultPage &&
            !debugWallets.reduce((acc, wallet) => {
                return acc || wallet.address === debugWallet.address;
            }, false)
        ) {
            setDebugWallet(debugWallets[0]);
        }
    }, [vaultPage]);

    useEffect(() => {
        if (page === Pages.TRADE) {
            if (tradePageBlackListTabs.has(selectedTradeTab)) {
                handleTabChange('Positions');
            }
        } else if (page === Pages.PORTFOLIO) {
            if (portfolioPageBlackListTabs.has(selectedTradeTab)) {
                handleTabChange('Positions');
            }
        }
    }, [page]);

    const {
        orderHistoryFetched,
        tradeHistoryFetched,
        fundingHistoryFetched,
        webDataFetched,
    } = useMemo(() => {
        return {
            orderHistoryFetched: fetchedChannels.has(
                WsChannels.USER_HISTORICAL_ORDERS,
            ),
            tradeHistoryFetched: fetchedChannels.has(WsChannels.USER_FILLS),
            fundingHistoryFetched: fetchedChannels.has(
                WsChannels.USER_FUNDINGS,
            ),
            webDataFetched: fetchedChannels.has(WsChannels.WEB_DATA2),
        };
    }, [fetchedChannels]);

    const handleTabChange = (tab: string) => {
        setSelectedTradeTab(tab);
    };

    const handleFilterChange = (selectedId: string) => {
        setSelectedFilter(selectedId);
    };

    const handleToggleSmallBalances = (newState?: boolean) => {
        const newValue = newState !== undefined ? newState : !hideSmallBalances;
        setHideSmallBalances(newValue);
    };

    const rightAlignedContent = (
        <div className={styles.tableControls}>
            {' '}
            <FilterDropdown
                options={filterOptions}
                selectedOption={selectedFilter}
                onChange={handleFilterChange}
            />
            {selectedTradeTab === 'Balances' && (
                <ToggleSwitch
                    isOn={hideSmallBalances}
                    onToggle={handleToggleSmallBalances}
                />
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (selectedTradeTab) {
            case 'Balances':
                return <BalancesTable hideSmallBalances={hideSmallBalances} />;
            case 'Positions':
                return (
                    <PositionsTable
                        isFetched={tradeHistoryFetched}
                        selectedFilter={selectedFilter}
                    />
                );
            case 'Open Orders':
                return (
                    <OpenOrdersTable
                        selectedFilter={selectedFilter}
                        isFetched={webDataFetched}
                        data={userOrders}
                    />
                );
            case 'TWAP':
                return <TwapTable selectedFilter={selectedFilter} />;
            case 'Trade History':
                return (
                    <TradeHistoryTable
                        data={userFills}
                        isFetched={tradeHistoryFetched}
                    />
                );
            case 'Funding History':
                return (
                    <FundingHistoryTable
                        userFundings={userFundings}
                        isFetched={fundingHistoryFetched}
                        selectedFilter={selectedFilter}
                    />
                );
            case 'Order History':
                return (
                    <OrderHistoryTable
                        selectedFilter={selectedFilter}
                        data={orderHistory}
                        isFetched={orderHistoryFetched}
                    />
                );
            case 'Deposits and Withdrawals':
                return <DepositsWithdrawalsTable />;
            case 'Depositors':
                return (
                    <VaultDepositorsTable
                        isFetched={vaultFetched ?? false}
                        data={vaultDepositors ?? []}
                    />
                );
            default:
                return (
                    <div className={styles.emptyState}>
                        Select a tab to view data
                    </div>
                );
        }
    };

    return (
        <div className={styles.tradeTableWrapper}>
            <Tabs
                tabs={tabs}
                defaultTab={selectedTradeTab}
                onTabChange={handleTabChange}
                rightContent={rightAlignedContent}
                wrapperId='tradeTableTabs'
                layoutIdPrefix='tradeTableTabsIndicator'
                staticHeight={`var(--trade-tables-tabs-height)`}
            />
            <motion.div
                className={`${styles.tableContent} ${
                    portfolioPage ? styles.portfolioPage : ''
                }`}
                key={selectedTradeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {renderTabContent()}
            </motion.div>
        </div>
    );
}
