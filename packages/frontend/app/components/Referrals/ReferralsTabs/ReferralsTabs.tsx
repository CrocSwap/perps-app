import { useState } from 'react';
import styles from './ReferralsTabs.module.css';

import { motion } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';
import ReferralsTable from '../ReferralsTable/ReferralsTable';
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
                return <div>enter code</div>;
            default:
                return (
                    <div className={styles.emptyState}>
                        Select a tab to view data
                    </div>
                );
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <Tabs
                tabs={availableTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                wrapperId='referralsTabs'
                layoutIdPrefix='referralsTabIndicator'
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
