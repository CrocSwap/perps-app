import type { VaultDetailsIF } from '~/utils/VaultIFs';
import styles from './vaultInfo.module.css';
import { useMemo, useState } from 'react';
import { useCallback } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { motion } from 'framer-motion';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';

interface VaultInfoProps {
    info: VaultDetailsIF | null;
}

export default function VaultInfo({ info }: VaultInfoProps) {
    const infoTabs = ['About', 'Vault Performance', 'Your Performance'];
    const [tab, setTab] = useState(infoTabs[0]);

    const about = useMemo(() => {
        return (
            <div>
                <div className={styles.titleText}>Leader</div>
                <div className={styles.contentText}>{info?.leader}</div>

                <div className={styles.titleText}>Description</div>
                <div className={styles.contentText}>{info?.description}</div>
            </div>
        );
    }, [info]);

    const getSkeletonLine = useCallback((width: number) => {
        return (
            <>
                <SkeletonNode
                    nodeStyle={{
                        height: '16px',
                        width: `${width}px`,
                    }}
                    wrapperStyle={{
                        justifyContent: 'left',
                        marginBottom: 'var(--margin-m)',
                    }}
                />
            </>
        );
    }, []);

    const renderTabContent = useCallback(() => {
        if (!info)
            return (
                <>
                    {getSkeletonLine(200)}
                    {getSkeletonLine(400)}
                    {getSkeletonLine(300)}
                    {getSkeletonLine(0)}
                    {getSkeletonLine(120)}
                    {getSkeletonLine(260)}
                </>
            );

        switch (tab) {
            case 'About':
                return about;
            case 'Vault Performance':
                return <div>Vault Performance</div>;
            case 'Your Performance':
                return <div>Your Performance</div>;
            default:
                return <div>About</div>;
        }
    }, [tab, info]);

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
