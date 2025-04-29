import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './TradeTable.module.css';
import Tabs from '~/components/Tabs/Tabs';
import FilterDropdown from '../FilterDropdown/FilterDropdown';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import BalancesTable from '../BalancesTable/BalancesTable';
import PositionsTable from '../PositionsTable/PositionsTable';
import OpenOrdersTable from '../OpenOrdersTable/OpenOrdersTable';
import TradeHistoryTable from '../TradeHistoryTable/TradeHistoryTable';
import FundingHistoryTable from '../FundingHistoryTable/FundingHistoryTable';
import OrderHistoryTable from '../OrderHistoryTable/OrderHistoryTable';
import DepositsWithdrawalsTable from '../DepositsWithdrawalsTable/DepositsWithdrawalsTable';
import TwapTable from '../TwapTable/TwapTable';

export interface FilterOption {
    id: string;
    label: string;
}
interface TradeTableProps {
    initialTab?: string;
}

const availableTabs = [
    'Balances',
    'Positions',
    'Open Orders',
    'TWAP',
    'Trade History',
    'Funding History',
    'Order History',
    'Deposits and Withdrawals',
];

const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'long', label: 'Long' },
    { id: 'short', label: 'Short' },
];
export default function TradeTable(props: TradeTableProps) {
    const { initialTab = 'Balances' } = props;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [hideSmallBalances, setHideSmallBalances] = useState(false);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleFilterChange = (selectedId: string) => {
        setSelectedFilter(selectedId);
        // if (onFilterChange) {
        //   onFilterChange([selectedId]);
        // }
    };

    const handleToggleSmallBalances = (newState?: boolean) => {
        const newValue = newState !== undefined ? newState : !hideSmallBalances;
        setHideSmallBalances(newValue);
        // if (onToggleSmallBalances) {
        //   onToggleSmallBalances(newValue);
        // }
    };

    const rightAlignedContent = (
        <div className={styles.tableControls}>
            {' '}
            <FilterDropdown
                options={filterOptions}
                selectedOption={selectedFilter}
                onChange={handleFilterChange}
            />
            {activeTab === 'Balances' && (
                <ToggleSwitch
                    isOn={hideSmallBalances}
                    onToggle={handleToggleSmallBalances}
                />
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Balances':
                return <BalancesTable hideSmallBalances={hideSmallBalances} />;
            case 'Positions':
                return <PositionsTable />;
            case 'Open Orders':
                return <OpenOrdersTable selectedFilter={selectedFilter} />;
            case 'TWAP':
                return <TwapTable />;
            case 'Trade History':
                return <TradeHistoryTable />;
            case 'Funding History':
                return <FundingHistoryTable />;
            case 'Order History':
                return <OrderHistoryTable selectedFilter={selectedFilter} />;
            case 'Deposits and Withdrawals':
                return <DepositsWithdrawalsTable />;
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
                tabs={availableTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                rightContent={rightAlignedContent}
                wrapperId='tradeTableTabs'
                layoutIdPrefix='tradeTableTabsIndicator'
            />
            <motion.div
                className={styles.tableContent}
                key={activeTab}
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
