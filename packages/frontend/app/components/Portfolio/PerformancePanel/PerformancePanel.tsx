import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';
import styles from './PerformancePanel.module.css';
import CollateralPieChart from './CollateralChart/CollateralPieChart';
import PortfolioChartHeader from './PortfolioChartHeader/PortfolioChartHeader';
import TabChartContext from './PerformanceChart/TabChartContext';

const AVAILABLE_TABS = ['Performance', 'Account Value', 'Collateral'];
const PERFORMANCE_METRICS = [
    { label: 'PNL', value: '$0.00' },
    { label: 'Volume', value: '$0.00' },
    { label: 'Max Drawdown', value: '0.00%' },
    { label: 'Total Equity', value: '$0.00' },
    { label: 'Account Equity', value: '$0.00' },
    { label: 'Vault Equity', value: '$0.00' },
];

const animationConfig = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
};

const MetricsDisplay = React.memo(() => (
    <div className={styles.metricsContainer}>
        {PERFORMANCE_METRICS.map((metric) => (
            <div className={styles.metricRow} key={metric.label}>
                <span>{metric.label}</span>
                {metric.value}
            </div>
        ))}
    </div>
));

export default function PerformancePanel() {
    const [activeTab, setActiveTab] = useState('');

    const [isLineDataFetched, setIsLineDataFetched] = useState(false);

    const [accountValueHistory, setAccountValueHistory] = useState<
        { time: number; value: number }[] | undefined
    >();

    const [pnlHistory, setPnlHistory] = useState<
        { time: number; value: number }[] | undefined
    >();

    const [userProfileLineData, setUserProfileLineData] = useState<any>();

    useEffect(() => {
        // Initialize tab as empty, then change to Performance after 2 seconds
        const timer = setTimeout(() => {
            setActiveTab('Performance');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleTabChange = useCallback((tab: string) => {
        setActiveTab(tab);
    }, []);

    const handleLineDataFetched = (isDataFetched: boolean) => {
        setIsLineDataFetched(() => isDataFetched);
    };

    const LoadingContent = useMemo(
        () => (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}></div>
                <div className={styles.loadingContent}></div>
            </div>
        ),
        [],
    );

    const [selectedVault, setSelectedVault] = useState<{
        label: string;
        value: string;
    }>({ label: 'Perps', value: 'perp' });

    const [selectedPeriod, setSelectedPeriod] = useState<{
        label: string;
        value: string;
    }>({ label: 'All-time', value: 'AllTime' });

    const TabContent_ = !activeTab ? (
        LoadingContent
    ) : (
        <div
            id={'performanceContainer'}
            className={styles.performanceContainer}
        >
            <MetricsDisplay />
            <motion.div {...animationConfig} className={styles.perfChart}>
                <PortfolioChartHeader
                    selectedVault={selectedVault}
                    setSelectedVault={setSelectedVault}
                    selectedPeriod={selectedPeriod}
                    setSelectedPeriod={setSelectedPeriod}
                />

                <TabChartContext
                    activeTab={activeTab}
                    selectedVault={selectedVault}
                    selectedPeriod={selectedPeriod}
                    handleLineDataFetched={handleLineDataFetched}
                    isLineDataFetched={isLineDataFetched}
                    setAccountValueHistory={setAccountValueHistory}
                    setPnlHistory={setPnlHistory}
                    pnlHistory={pnlHistory}
                    accountValueHistory={accountValueHistory}
                    userProfileLineData={userProfileLineData}
                    setUserProfileLineData={setUserProfileLineData}
                />

                {/* {activeTab.toLowerCase()} */}
            </motion.div>
        </div>
    );

    return (
        <div className={styles.container}>
            <Tabs
                tabs={AVAILABLE_TABS}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                wrapperId='performanceTabs'
                layoutIdPrefix='performanceTabIndicator'
            />
            <AnimatePresence mode='wait'>
                <div className={styles.tableContent} key={activeTab}>
                    {TabContent_}
                </div>
            </AnimatePresence>
        </div>
    );
}
