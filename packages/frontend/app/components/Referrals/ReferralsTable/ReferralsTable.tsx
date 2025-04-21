import { useState } from 'react';
import styles from './ReferralsTable.module.css'

import { motion } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';

interface PropsIF {
    initialTab?: string;
}

const availableTabs = ['Referrals', 'Reward History'];

export default function RefferalsTable(props: PropsIF) {
    const { initialTab = 'Referrals' } = props;
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Referrals':
                return <div>enter code</div>;
            case 'Reward History':
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
                wrapperId="referralsTabs" 
                layoutIdPrefix="referralsTabIndicator" 
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
