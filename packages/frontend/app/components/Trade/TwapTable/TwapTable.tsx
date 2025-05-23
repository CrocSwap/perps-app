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
    const { initialTab = 'Active', selectedFilter } = props;
    const [activeTab, setActiveTab] = useState(initialTab);

    const { fetchedChannels, twapHistory, twapSliceFills, activeTwaps } =
        useTradeDataStore();

    const { twapHistoryFetched, twapSliceFillsFetched, webDataFetched } =
        useMemo(() => {
            return {
                twapHistoryFetched: fetchedChannels.has(
                    WsChannels.TWAP_HISTORY,
                ),
                twapSliceFillsFetched: fetchedChannels.has(
                    WsChannels.TWAP_SLICE_FILLS,
                ),
                webDataFetched: fetchedChannels.has(WsChannels.WEB_DATA2),
            };
        }, [fetchedChannels]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Active':
                return (
                    <ActiveTwapTable
                        data={activeTwaps}
                        isFetched={webDataFetched}
                        selectedFilter={selectedFilter}
                    />
                );

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
                return (
                    <ActiveTwapTable
                        data={activeTwaps}
                        isFetched={webDataFetched}
                        selectedFilter={selectedFilter}
                    />
                );
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <Tabs
                tabs={availableTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
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
