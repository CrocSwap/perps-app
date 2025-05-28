import { useEffect, useMemo, useState } from 'react';
import styles from './TwapTable.module.css';
import Tabs from '~/components/Tabs/Tabs';
import { motion } from 'framer-motion';
import HistoryTwapTable from './HistoryTwapTable/HistoryTwapTable';
import FillTwapTable from './FillTwapTable/FillTwapTable';
import ActiveTwapTable from './ActiveTwapTable/ActiveTwapTable';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { WsChannels } from '~/utils/Constants';

interface Props {
    initialTab?: string;
    selectedFilter?: string;
}

const availableTabs = ['Active', 'History', 'Fill History'];
export default function TwapTable(props: Props) {
    const STORAGE_KEY = 'twapTable:selectedTab';

    const { initialTab = 'Active', selectedFilter } = props;
    const [activeTab, setActiveTab] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || initialTab;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, activeTab);
    }, [activeTab]);

    const { fetchedChannels, twapHistory, twapSliceFills } =
        useTradeDataStore();

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, activeTab);
    }, [activeTab]);

    const { twapHistoryFetched, twapSliceFillsFetched } = useMemo(() => {
        return {
            twapHistoryFetched: fetchedChannels.has(WsChannels.TWAP_HISTORY),
            twapSliceFillsFetched: fetchedChannels.has(
                WsChannels.TWAP_SLICE_FILLS,
            ),
        };
    }, [fetchedChannels]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Active':
                return <ActiveTwapTable />;

            case 'History':
                return (
                    <HistoryTwapTable
                        data={twapHistory}
                        isFetched={twapHistoryFetched}
                        selectedFilter={selectedFilter}
                    />
                );
            case 'Open Orders':
                return (
                    <div className={styles.emptyState}>
                        TWAP data will appear here
                    </div>
                );
            case 'Fill History':
                return (
                    <FillTwapTable
                        data={twapSliceFills}
                        isFetched={twapSliceFillsFetched}
                        selectedFilter={selectedFilter}
                    />
                );

            default:
                return <ActiveTwapTable />;
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <Tabs
                tabs={availableTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                staticHeight={`var(--trade-tables-tabs-height)`}
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
