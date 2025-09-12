import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { Pages, usePage } from '~/hooks/usePage';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { WsChannels } from '~/utils/Constants';
import type { VaultFollowerStateIF } from '~/utils/VaultIFs';
import BalancesTable from '../BalancesTable/BalancesTable';
import DepositsWithdrawalsTable from '../DepositsWithdrawalsTable/DepositsWithdrawalsTable';
import FilterDropdown from '../FilterDropdown/FilterDropdown';
import FundingHistoryTable from '../FundingHistoryTable/FundingHistoryTable';
import OpenOrdersTable from '../OpenOrdersTable/OpenOrdersTable';
import OrderHistoryTable from '../OrderHistoryTable/OrderHistoryTable';
import PositionsTable from '../PositionsTable/PositionsTable';
import TradeHistoryTable from '../TradeHistoryTable/TradeHistoryTable';
// import TwapTable from '../TwapTable/TwapTable';
import { useApp } from '~/contexts/AppContext';
import VaultDepositorsTable from '../VaultDepositorsTable/VaultDepositorsTable';
import styles from './TradeTable.module.css';
import { useDebugStore } from '~/stores/DebugStore';
import useMediaQuery from '~/hooks/useMediaQuery';
import { t } from 'i18next';
export interface FilterOption {
    id: string;
    label: string;
}

const tradePageBlackListTabs = new Set([
    'Funding History',
    'Deposits and Withdrawals',
    'Depositors',
]);

const portfolioPageBlackListTabs = new Set([
    'Depositors',
    'Funding History',
    'Deposits and Withdrawals',
]);
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
    const { isDebugWalletActive } = useDebugStore();
    // const [hideSmallBalances, setHideSmallBalances] = useState(false);

    const { assignDefaultAddress } = useApp();

    const { page } = usePage();

    const {
        isLoading: positionsLoading,
        positions,
        lastUpdateTime,
    } = useUnifiedMarginData();

    const isMobile = useMediaQuery('(max-width: 480px)');
    const tabs = useMemo(() => {
        if (!page) return [];

        const availableTabs = [
            'common.balances',
            'common.positions',
            'common.openOrders',
            // 'common.twap',
            'common.tradeHistory',
            // 'common.fundingHistory',
            'common.orderHistory',
            // 'common.depositsAndWithdrawals',
        ];

        if (vaultPage) {
            availableTabs.push('Depositors');
        }

        // Filter for different pages
        let filteredTabs;
        if (page === Pages.TRADE) {
            filteredTabs = availableTabs.filter(
                (tab) => !tradePageBlackListTabs.has(tab),
            );
        } else if (page === Pages.PORTFOLIO) {
            filteredTabs = availableTabs.filter(
                (tab) => !portfolioPageBlackListTabs.has(tab),
            );
        } else {
            filteredTabs = availableTabs;
        }

        if (isMobile) {
            return filteredTabs.filter(
                (tab) => tab === 'common.positions' || tab === 'Open Orders',
            );
        }

        return filteredTabs;
    }, [page, vaultPage]);

    //  this useEffect is to handle tab switching when screen size changes
    useEffect(() => {
        // If we're on mobile and current tab isn't allowed, switch to Positions
        if (
            isMobile &&
            selectedTradeTab !== 'common.positions' &&
            selectedTradeTab !== 'Open Orders'
        ) {
            handleTabChange('common.positions');
        }
    }, [selectedTradeTab]);

    // reset wallet on trade tables after switch back from vaults
    useEffect(() => {
        if (!vaultPage) {
            assignDefaultAddress();
        }
    }, [vaultPage]);

    useEffect(() => {
        if (page === Pages.TRADE) {
            if (tradePageBlackListTabs.has(selectedTradeTab)) {
                handleTabChange('common.positions');
            }
        } else if (page === Pages.PORTFOLIO) {
            if (portfolioPageBlackListTabs.has(selectedTradeTab)) {
                handleTabChange('common.positions');
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
    }, [Array.from(fetchedChannels).join(',')]);

    const handleTabChange = (tab: string) => {
        setSelectedTradeTab(tab);
    };

    const handleFilterChange = (selectedId: string) => {
        setSelectedFilter(selectedId);
    };

    const rightAlignedContent = (
        <div className={styles.tableControls}>
            <FilterDropdown
                options={filterOptions}
                selectedOption={selectedFilter}
                onChange={handleFilterChange}
            />
        </div>
    );

    const renderTabContent = () => {
        switch (selectedTradeTab) {
            case 'common.balances':
                return <BalancesTable />;
            case 'common.positions':
                return (
                    <PositionsTable
                        isFetched={
                            !isDebugWalletActive
                                ? !positionsLoading || lastUpdateTime > 0
                                : webDataFetched
                        }
                        selectedFilter={selectedFilter}
                    />
                );
            case 'common.openOrders':
                return (
                    <OpenOrdersTable
                        selectedFilter={selectedFilter}
                        isFetched={orderHistoryFetched}
                        data={userOrders}
                    />
                );
            // case 'TWAP':
            //     return <TwapTable selectedFilter={selectedFilter} />;
            case 'common.tradeHistory':
                return (
                    <TradeHistoryTable
                        data={userFills}
                        isFetched={tradeHistoryFetched}
                    />
                );
            case 'common.fundingHistory':
                return (
                    <FundingHistoryTable
                        userFundings={userFundings}
                        isFetched={fundingHistoryFetched}
                        selectedFilter={selectedFilter}
                    />
                );
            case 'common.orderHistory':
                return (
                    <OrderHistoryTable
                        selectedFilter={selectedFilter}
                        data={orderHistory}
                        isFetched={orderHistoryFetched}
                    />
                );
            case 'common.depositsAndWithdrawals':
                return (
                    <DepositsWithdrawalsTable isFetched={tradeHistoryFetched} />
                );
            case 'common.depositors':
                return (
                    <VaultDepositorsTable
                        isFetched={vaultFetched ?? false}
                        data={vaultDepositors ?? []}
                    />
                );
            default:
                return (
                    <div className={styles.emptyState}>
                        {t('tradeTable.selectATabToViewData')}
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
