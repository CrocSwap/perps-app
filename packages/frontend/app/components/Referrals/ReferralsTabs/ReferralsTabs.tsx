import { useState } from 'react';
import { useReferralStore } from '~/stores/ReferralStore';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from './ReferralsTabs.module.css';

import { motion } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';
import ReferralsTable from '../ReferralsTable/ReferralsTable';
import RewardHistoryTable from '../ReferralsTable/RewardHistoryTable';
import type {
    PayoutMovementIF,
    PayoutByReferrerT,
} from '~/routes/referrals/referrals';

interface PropsIF {
    initialTab?: string;
    payoutMovements: PayoutMovementIF[];
    payoutsByReferrer: PayoutByReferrerT[];
}

const availableTabs = ['referrals.title', 'referrals.rewardHistory'];

export default function ReferralsTabs(props: PropsIF) {
    const {
        initialTab = 'referrals.title',
        payoutMovements,
        payoutsByReferrer,
    } = props;
    const [activeTab, setActiveTab] = useState(initialTab);
    const { rewardHistory } = useReferralStore();
    const hasData =
        (payoutMovements?.length ?? 0) > 0 ||
        (payoutsByReferrer?.length ?? 0) > 0 ||
        (rewardHistory?.length ?? 0) > 0;
    const [isCollapsed, setIsCollapsed] = useState(!hasData);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'referrals.title':
                return (
                    <ReferralsTable
                        payoutMovements={payoutMovements}
                        payoutsByReferrer={payoutsByReferrer}
                    />
                );
            case 'referrals.rewardHistory':
                return <RewardHistoryTable />;
            default:
                return (
                    <div className={styles.emptyState}>
                        Select a tab to view data
                    </div>
                );
        }
    };

    return (
        <div
            className={`${styles.tableWrapper}${isCollapsed ? ` ${styles.collapsed}` : ''}`}
            onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
        >
            <div className={styles.tabsRow}>
                <Tabs
                    tabs={availableTabs}
                    defaultTab={activeTab}
                    onTabChange={handleTabChange}
                    wrapperId='referralsTabs'
                    layoutIdPrefix='referralsTabIndicator'
                />
                <button
                    className={styles.collapseBtn}
                    onClick={() => setIsCollapsed((v) => !v)}
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <FaChevronDown size={12} />
                    ) : (
                        <FaChevronUp size={12} />
                    )}
                </button>
            </div>
            {isCollapsed && !hasData && (
                <div className={styles.collapsedHint}>
                    No data to display · tap to expand
                </div>
            )}
            <motion.div
                className={`${styles.tableContent}${isCollapsed ? ` ${styles.hidden}` : ''}`}
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
