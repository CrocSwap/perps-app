import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';
import styles from './PerformancePanel.module.css';
import CollateralPieChart from './CollateralChart/CollateralPieChart';
import PortfolioChartHeader from './PortfolioChartHeader/PortfolioChartHeader';
import TabChartContext from './PerformanceChart/TabChartContext';
import useNumFormatter from '~/hooks/useNumFormatter';

interface PerformancePanelProps {
    userData: any;
    panelHeight?: number;
    isMobile: boolean;
}

const AVAILABLE_TABS = ['Performance', 'Account Value', 'Collateral'];

const animationConfig = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
};

export default function PerformancePanel({
    userData,
    panelHeight,
    isMobile,
}: PerformancePanelProps) {
    const [activeTab, setActiveTab] = useState('');
    const chartStageRef = useRef<HTMLDivElement>(null);

    const { formatNum } = useNumFormatter();

    const pnlFormatted = userData?.data?.leaderboard[0]?.pnl
        ? formatNum(userData?.data?.leaderboard[0]?.pnl, 2, true, true)
        : '$0.00';
    const volumeFormatted = userData?.data?.leaderboard[0]?.volume
        ? formatNum(userData?.data?.leaderboard[0]?.volume, 2, true, true)
        : '$0.00';
    const maxDrawdownFormatted = userData?.data?.leaderboard[0]?.maxDrawdown
        ? formatNum(userData?.data?.leaderboard[0]?.maxDrawdown, 2)
        : '0.00%';
    const totalEquityFormatted = userData?.data?.leaderboard[0]?.account_value
        ? formatNum(
              userData?.data?.leaderboard[0]?.account_value,
              2,
              true,
              true,
          )
        : '$0.00';
    const accountEquityFormatted = userData?.data?.leaderboard[0]?.account_value
        ? formatNum(
              userData?.data?.leaderboard[0]?.account_value,
              2,
              true,
              true,
          )
        : '$0.00';
    const vaultEquityFormatted = userData?.data?.leaderboard[0]?.vaultEquity
        ? formatNum(userData?.data?.leaderboard[0]?.vaultEquity)
        : '$0.00';

    const PERFORMANCE_METRICS = [
        { label: 'PNL', value: pnlFormatted },
        { label: 'Volume', value: volumeFormatted },
        { label: 'Max Drawdown', value: maxDrawdownFormatted },
        { label: 'Total Equity', value: totalEquityFormatted },
        { label: 'Account Equity', value: accountEquityFormatted },
        { label: 'Vault Equity', value: vaultEquityFormatted },
    ];

    const MetricsDisplay = React.memo(() => (
        <div id={'metricsContainer'} className={styles.metricsContainer}>
            {PERFORMANCE_METRICS.map((metric) => (
                <div className={styles.metricRow} key={metric.label}>
                    <span>{metric.label}</span>
                    {metric.value}
                </div>
            ))}
        </div>
    ));

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
                    panelHeight={panelHeight}
                    isMobile={isMobile}
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
