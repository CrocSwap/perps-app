import React, {
    useMemo,
    useState,
    useCallback,
    useRef,
    useEffect,
} from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Tabs from '~/components/Tabs/Tabs';
import styles from './PerformancePanel.module.css';
import CollateralPieChart from './CollateralChart/CollateralPieChart';
import PortfolioChartHeader from './PortfolioChartHeader/PortfolioChartHeader';
import TabChartContext from './PerformanceChart/TabChartContext';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';

interface PerformancePanelProps {
    userData: any;
    panelHeight?: number;
    isMobile: boolean;
}

type PerformanceTab = 'performance' | 'accountValue' | 'collateral';

const AVAILABLE_TABS = [
    { id: 'performance', label: 'portfolio.performance' },
    { id: 'accountValue', label: 'portfolio.accountValue' },
    { id: 'collateral', label: 'portfolio.collateral' },
];

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
    const { t } = useTranslation();
    const { portfolioPerformanceTab, setPortfolioPerformanceTab } =
        useAppSettings();
    const [activeTab, setActiveTab] = useState<PerformanceTab>(
        portfolioPerformanceTab,
    );
    const chartStageRef = useRef<HTMLDivElement>(null);

    const { formatNum } = useNumFormatter();

    const DASH_PLACEHOLDER = '-';

    const pnlFormatted =
        typeof userData?.pnl === 'number'
            ? formatNum(userData.pnl, 2, true, true)
            : DASH_PLACEHOLDER;

    const realizedPnlFormatted =
        typeof userData?.realized_pnl === 'number'
            ? formatNum(userData.realized_pnl, 2, true, true)
            : DASH_PLACEHOLDER;

    const unrealizedPnlFormatted =
        typeof userData?.unrealized_pnl === 'number'
            ? formatNum(userData.unrealized_pnl, 2, true, true)
            : DASH_PLACEHOLDER;

    const volumeFormatted =
        typeof userData?.total_volume === 'number'
            ? formatNum(userData.total_volume, 2, true, true)
            : DASH_PLACEHOLDER;
    const maxDrawdownFormatted =
        typeof userData?.max_drawdown === 'number'
            ? `${formatNum(userData.max_drawdown, 2)}%`
            : DASH_PLACEHOLDER;
    const totalEquityFormatted =
        typeof userData?.account_value === 'number'
            ? formatNum(userData.account_value, 2, true, true)
            : DASH_PLACEHOLDER;
    const accountEquityFormatted =
        typeof userData?.account_value === 'number'
            ? formatNum(userData.account_value, 2, true, true)
            : DASH_PLACEHOLDER;
    const vaultEquityFormatted =
        typeof userData?.vaultEquity === 'number'
            ? formatNum(userData.vaultEquity)
            : DASH_PLACEHOLDER;

    const collateralFormatted =
        typeof userData?.collateral === 'number'
            ? formatNum(userData.collateral)
            : DASH_PLACEHOLDER;

    const PERFORMANCE_METRICS = [
        { label: t('portfolio.pnl'), value: pnlFormatted },
        { label: t('portfolio.realizedPnl'), value: realizedPnlFormatted },
        { label: t('portfolio.unrealizedPnl'), value: unrealizedPnlFormatted },
        { label: t('portfolio.volume'), value: volumeFormatted },
        // { label: 'Max Drawdown', value: maxDrawdownFormatted },
        // { label: 'Total Equity', value: totalEquityFormatted },
        { label: t('portfolio.accountEquity'), value: accountEquityFormatted },
        // { label: 'Vault Equity', value: vaultEquityFormatted },
    ];

    const MetricsDisplay = React.memo(() => (
        <div id={'metricsContainer'} className={styles.metricsContainer}>
            <div className={styles.accountOverviewHeader}>
                <div className={styles.accountOverviewTitle}>
                    {t('portfolio.accountOverview')}
                </div>
                <div className={styles.accountOverviewSubtitle}>
                    {t('portfolio.updateFrequencyInMinutes', {
                        numMinutes: 30,
                    })}
                </div>
            </div>
            {PERFORMANCE_METRICS.map((metric) => (
                <div className={styles.metricRow} key={metric.label}>
                    <span>{metric.label}</span>
                    {metric.value}
                </div>
            ))}
        </div>
    ));

    const [accountValueHistory, setAccountValueHistory] = useState<
        { time: number; value: number }[] | undefined
    >();

    const [pnlHistory, setPnlHistory] = useState<
        { time: number; value: number }[] | undefined
    >();

    const [userProfileLineData, setUserProfileLineData] = useState<any>();

    useEffect(() => {
        setActiveTab(portfolioPerformanceTab);
    }, [portfolioPerformanceTab]);

    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab as PerformanceTab);
            setPortfolioPerformanceTab(tab as PerformanceTab);
        },
        [setPortfolioPerformanceTab],
    );

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
    }>({ label: t('portfolio.perps'), value: 'perp' });

    const [selectedPeriod, setSelectedPeriod] = useState<{
        label: string;
        value: string;
        timeframe: number;
    }>({ label: t('portfolio.allTime'), value: 'AllTime', timeframe: 0 });

    const TabContent_ = !activeTab ? (
        LoadingContent
    ) : (
        <div
            id={'performanceContainer'}
            className={styles.performanceContainer}
        >
            <MetricsDisplay />
            <motion.div {...animationConfig} className={styles.perfChart}>
                <div
                    id={'performanceChartControls'}
                    className={styles.chartControls}
                >
                    <div className={styles.chartControlsTabsRow}>
                        <Tabs
                            tabs={AVAILABLE_TABS}
                            defaultTab={activeTab}
                            onTabChange={handleTabChange}
                            wrapperId='performanceTabs'
                            layoutIdPrefix='performanceTabIndicator'
                        />
                    </div>
                    {activeTab !== 'collateral' && (
                        <div className={styles.chartControlsFiltersRow}>
                            <PortfolioChartHeader
                                selectedVault={selectedVault}
                                setSelectedVault={setSelectedVault}
                                selectedPeriod={selectedPeriod}
                                setSelectedPeriod={setSelectedPeriod}
                            />
                        </div>
                    )}
                </div>

                <TabChartContext
                    activeTab={activeTab}
                    selectedVault={selectedVault}
                    selectedPeriod={selectedPeriod}
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
            <div className={styles.tableContent}>{TabContent_}</div>
        </div>
    );
}
