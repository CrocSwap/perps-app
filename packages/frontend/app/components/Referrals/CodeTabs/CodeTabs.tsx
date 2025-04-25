import { useState } from 'react';
import styles from './CodeTabs.module.css';
import Tabs from '~/components/Tabs/Tabs';
import { motion } from 'framer-motion';

interface Props {
    initialTab?: string;
}
const availableTabs = ['Enter Code', 'Create Code', 'Claim'];
export default function CodeTabs(props: Props) {
    const { initialTab = 'Enter Code' } = props;
    const [activeTab, setActiveTab] = useState(initialTab);

    const [referralCode, setReferralCode] = useState('');

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };
    const enterCodeContent = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>Enter a referral code</h6>
                <input
                    type='text'
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                />
                <h6>You will receive a discount on your fees</h6>
            </div>
            <button>Enter</button>
        </section>
    );

    const createCodeContent = (
        <section className={styles.sectionWithButton}>
            <div className={styles.createCodeContent}>
                <p>Your code is DATAWALLET</p>
                <div className={styles.walletLink}>
                    <a href='#'>linktocode.com/join/datawallet</a>
                </div>
                <p>
                    You will receive <span>10%</span> of referred users fees and
                    they will receive a <span>4%</span> discount. See the Docs
                    for more.
                </p>
            </div>
            <button>Create</button>
        </section>
    );
    const claimContent = (
        <section className={styles.sectionWithButton}>
            
            <div className={styles.claimContent}>
                <p>Claim $0.00 in rewards</p>
            </div>
            <button>Claim</button>
        </section>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Enter Code':
                return enterCodeContent;
            case 'Create Code':
                return createCodeContent;
            case 'Claim':
                return claimContent;
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
                wrapperId='codeTabs'
                layoutIdPrefix='codeTabIndicator'
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
