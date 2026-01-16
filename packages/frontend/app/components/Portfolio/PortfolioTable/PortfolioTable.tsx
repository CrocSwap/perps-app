import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { WsChannels } from '~/utils/Constants';
import type { VaultFollowerStateIF } from '~/utils/VaultIFs';

import { useApp } from '~/contexts/AppContext';
import styles from './PortfolioTable.module.css';
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

    /** Layout mode: 'tabs' = current tabbed behavior, 'stacked' = all sections visible vertically */
    layout?: 'tabs' | 'stacked';

    /** Which sections to show in stacked mode. If not provided, shows all. */
    visibleSections?: string[];

    /** Max height for each table in stacked mode (default: 300) */
    stackedTableHeight?: number;

    /** Optional address to view portfolio for (overrides session) */
    urlAddress?: string;

    isTransactionsView?: boolean;
}

// Section labels for stacked mode headers
const SECTION_LABELS: Record<string, { title: string; emptyText: string }> = {
    'common.balances': { title: 'Balances', emptyText: 'No balances' },
    'common.positions': { title: 'Positions', emptyText: 'No open positions' },
    'common.openOrders': { title: 'Open Orders', emptyText: 'No open orders' },
    'common.tradeHistory': {
        title: 'Trade History',
        emptyText: 'No trades yet',
    },
    'common.fundingHistory': {
        title: 'Funding History',
        emptyText: 'No funding history',
    },
    'common.orderHistory': {
        title: 'Order History',
        emptyText: 'No order history',
    },
    'common.depositsAndWithdrawals': {
        title: 'Deposits & Withdrawals',
        emptyText: 'No deposits or withdrawals',
    },
};

/**
 * PortfolioTables – a portfolio-only version of TradeTables
 * Tab set: Balances, Positions, Open Orders, Trade History, Order History, Deposits & Withdrawals
 *
 * Supports two layout modes:
 * - 'tabs' (default): Traditional tabbed interface
 * - 'stacked': All sections visible vertically, each with its own scrollable table
 */
export default function PortfolioTables(props: PortfolioTablesProps) {
    const {
        mobileExternalSwitcher,
        layout = 'tabs',
        visibleSections,
        stackedTableHeight = 300,
        urlAddress,
        isTransactionsView,
    } = props;

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

    const { balance } = useUnifiedMarginData();

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
            'common.tradeHistory',
            'common.orderHistory',
            'common.depositsAndWithdrawals',
        ],
        [],
    );

    // Sections to show in stacked mode
    const stackedSections = useMemo(() => {
        if (visibleSections && visibleSections.length > 0) {
            return visibleSections;
        }
        return tabs;
    }, [visibleSections, tabs]);

    const allowedTabSet = useMemo(() => new Set(tabs), [tabs]);

    // Ensure default address is restored on portfolio
    useEffect(() => {
        assignDefaultAddress();
    }, [assignDefaultAddress]);

    // If the globally stored tab is not in the Portfolio set, coerce it to Positions
    useEffect(() => {
        if (layout === 'tabs' && !allowedTabSet.has(selectedTradeTab)) {
            handleTabChange('common.positions');
        }
    }, [selectedTradeTab, allowedTabSet, layout]);

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

    // Render a specific table component by key
    const renderTableByKey = (tabKey: string) => {
        switch (tabKey) {
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

            default:
                return (
                    <div className={styles.emptyState}>
                        {t('tradeTable.selectATabToViewData')}
                    </div>
                );
        }
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

    // Get item count for a section
    const getItemCount = (sectionKey: string): number | null => {
        switch (sectionKey) {
            case 'common.balances':
                return balance ? 1 : 0;

            case 'common.positions':
                return positions?.length ?? null;

            case 'common.openOrders':
                return userOrders?.length ?? null;

            case 'common.tradeHistory':
                return userFills?.length ?? null;

            case 'common.fundingHistory':
                return userFundings?.length ?? null;

            case 'common.orderHistory':
                return orderHistory?.length ?? null;

            default:
                return null;
        }
    };

    // Format count text
    const getCountText = (
        sectionKey: string,
        justCount?: boolean,
    ): string | boolean | null => {
        const count = getItemCount(sectionKey);
        if (count === null) return null;

        const labels: Record<string, string> = {
            'common.positions': count === 1 ? 'position' : 'positions',
            'common.openOrders': count === 1 ? 'open order' : 'open orders',
            'common.tradeHistory': count === 1 ? 'trade' : 'trades',
            'common.fundingHistory': count === 1 ? 'entry' : 'entries',
            'common.orderHistory': count === 1 ? 'order' : 'orders',
        };
        if (justCount) return `${count}`;

        return `${count} ${labels[sectionKey] || 'items'}`;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STACKED LAYOUT
    // ═══════════════════════════════════════════════════════════════════════
    if (layout === 'stacked') {
        return (
            <div
                className={`${styles.stackedWrapper} ${isTransactionsView && styles.stackedWrapperTransactions}`}
            >
                {stackedSections.map((sectionKey) => {
                    const sectionInfo = SECTION_LABELS[sectionKey] || {
                        title: sectionKey,
                        emptyText: 'No data',
                    };
                    const countText = getCountText(sectionKey, true);

                    return (
                        <div key={sectionKey} className={styles.stackedSection}>
                            <div className={styles.stackedSectionHeader}>
                                <h3 className={styles.stackedSectionTitle}>
                                    {sectionInfo.title}
                                    {countText !== null
                                        ? ` (${countText})`
                                        : ''}
                                    {/* ({' '}
                                    <p
                                        className={
                                            styles.stackedSectionSubtitle
                                        }
                                    >
                                        {countText}
                                    </p>
                                    ) */}
                                </h3>
                            </div>
                            <div
                                className={styles.stackedSectionContent}
                                style={{
                                    height: isTransactionsView
                                        ? '100%'
                                        : stackedTableHeight,
                                }}
                            >
                                {renderTableByKey(sectionKey)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TABS LAYOUT (default)
    // ═══════════════════════════════════════════════════════════════════════
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
                {renderTableByKey(selectedTradeTab)}
            </motion.div>
        </div>
    );
}
