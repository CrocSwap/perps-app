import { useState } from 'react';
import styles from './ReferralsTabs.module.css';

import { motion } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';
import ReferralsTable from '../ReferralsTable/ReferralsTable';

interface PropsIF {
    initialTab?: string;
}

const availableTabs = ['referrals.title', 'referrals.rewardHistory'];

export default function RefferalsTabs(props: PropsIF) {
    const { initialTab = 'referrals.title' } = props;
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'referrals.title':
                return <ReferralsTable />;
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
