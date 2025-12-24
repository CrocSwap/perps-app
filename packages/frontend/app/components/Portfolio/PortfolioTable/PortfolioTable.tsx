import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { WsChannels } from '~/utils/Constants';
import type { VaultFollowerStateIF } from '~/utils/VaultIFs'; // kept for parity, not used here

// import TwapTable from '../TwapTable/TwapTable';
import { useApp } from '~/contexts/AppContext';
import styles from './PortfolioTable.module.css'; // reuse same CSS module
import { useDebugStore } from '~/stores/DebugStore';
import useMediaQuery from '~/hooks/useMediaQuery';
import { t } from 'i18next';
import TradeHistoryTable from '~/components/Trade/TradeHistoryTable/TradeHistoryTable';
import FilterDropdown from '~/components/Trade/FilterDropdown/FilterDropdown';
import BalancesTable from '~/components/Trade/BalancesTable/BalancesTable';
import PositionsTable from '~/components/Trade/PositionsTable/PositionsTable';
import OpenOrdersTable from '~/components/Trade/OpenOrdersTable/OpenOrdersTable';
import FundingHistoryTable from '~/components/Trade/FundingHistoryTable/FundingHistoryTable';
import OrderHistoryTable from '~/components/Trade/OrderHistoryTable/OrderHistoryTable';
import DepositsWithdrawalsTable from '~/components/Trade/DepositsWithdrawalsTable/DepositsWithdrawalsTable';

export interface FilterOption {
    id: string;
    label: string;
}

interface PortfolioTablesProps {
    /** If true, the parent renders an external tab switcher and we hide Tabs here */
    mobileExternalSwitcher?: boolean;
}

/**
 * PortfolioTables – a portfolio-only version of TradeTables
 * Tab set: Balances, Positions, Open Orders, Trade History, Order History, Deposits & Withdrawals
 * Excludes: Funding History, Depositors
 */
export default function PortfolioTables(props: PortfolioTablesProps) {
    const { mobileExternalSwitcher } = props;

    const filterOptions: FilterOption[] = [
        { id: 'all', label: t('common.all') },
        { id: 'active', label: t('common.active') },
        { id: 'long', label: t('common.long') },
        { id: 'short', label: t('common.short') },
    ];

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
    const { assignDefaultAddress } = useApp();

    const {
        isLoading: positionsLoading,
        positions,
        lastUpdateTime,
    } = useUnifiedMarginData();

    const isMobile = useMediaQuery('(max-width: 480px)');

    // Fixed tab list for Portfolio page
    const tabs = useMemo(
        () => [
            'common.balances',
            'common.positions',
            'common.openOrders',
            // 'common.twap',
            'common.tradeHistory',
            // 'common.fundingHistory', // intentionally excluded on portfolio
            'common.orderHistory',
            'common.depositsAndWithdrawals',
        ],
        [],
    );

    const allowedTabSet = useMemo(() => new Set(tabs), [tabs]);

    // Ensure default address is restored on portfolio (parity with prior behavior)
    useEffect(() => {
        assignDefaultAddress();
    }, [assignDefaultAddress]);

    // If the globally stored tab is not in the Portfolio set, coerce it to Positions
    useEffect(() => {
        if (!allowedTabSet.has(selectedTradeTab)) {
            handleTabChange('common.positions');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTradeTab, allowedTabSet]);

    const {
        orderHistoryFetched,
        tradeHistoryFetched,
        fundingHistoryFetched, // kept for completeness
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
        // turning the Set into a string to get a stable dep
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
            //   return <TwapTable selectedFilter={selectedFilter} />;

            case 'common.tradeHistory':
                return (
                    <TradeHistoryTable
                        data={userFills}
                        isFetched={tradeHistoryFetched}
                    />
                );

            // Funding History is intentionally not exposed on Portfolio, but leaving handler here in case you add it later
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

            default:
                return (
                    <div className={styles.emptyState}>
                        {t('tradeTable.selectATabToViewData')}
                    </div>
                );
        }
    };

    // On Portfolio we generally keep tabs visible; still honor external mobile switcher if provided
    const showTabs = !(isMobile && mobileExternalSwitcher);

    return (
        <div className={styles.tradeTableWrapper}>
            {showTabs && (
                <Tabs
                    tabs={tabs}
                    defaultTab={
                        allowedTabSet.has(selectedTradeTab)
                            ? selectedTradeTab
                            : 'common.positions'
                    }
                    onTabChange={handleTabChange}
                    rightContent={rightAlignedContent}
                    wrapperId='portfolioTableTabs'
                    layoutIdPrefix='portfolioTableTabsIndicator'
                    staticHeight={`var(--trade-tables-tabs-height)`}
                />
            )}

            <motion.div
                className={`${styles.tableContent} ${styles.portfolioPage} ${
                    !showTabs ? styles.noTabs : ''
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
