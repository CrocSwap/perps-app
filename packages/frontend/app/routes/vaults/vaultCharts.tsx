import type { VaultDetailsIF } from '~/utils/VaultIFs';
import styles from './vaultCharts.module.css';
import { useState } from 'react';
import { useCallback } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { motion } from 'framer-motion';
interface VaultChartsProps {
    info: VaultDetailsIF | null;
}

export default function VaultCharts({ info }: VaultChartsProps) {
    const infoTabs = ['Vault Value', 'Vault PnL'];
    const [tab, setTab] = useState(infoTabs[0]);

    const renderTabContent = useCallback(() => {
        switch (tab) {
            case 'Vault Value':
                return (
                    <div className={styles.chartPlaceholder}>Value Chart</div>
                );
            case 'Vault PnL':
                return <div className={styles.chartPlaceholder}>PnL Chart</div>;
            default:
                return <div>About</div>;
        }
    }, [tab]);

    return (
        <>
            <Tabs tabs={infoTabs} defaultTab={tab} onTabChange={setTab} />
            <motion.div
                key={tab}
                className={styles.content}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {renderTabContent()}
            </motion.div>
        </>
    );
}
