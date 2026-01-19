import { useEffect, useState, useRef, useCallback } from 'react';
import LineChart from '~/components/LineChart/LineChart';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useUserDataStore } from '~/stores/UserDataStore';
import CollateralPieChart from '../CollateralChart/CollateralPieChart';

export interface TabChartContext {
    activeTab: string;
    selectedVault: { label: string; value: string };
    selectedPeriod: { label: string; value: string; timeframe: number };
    pnlHistory: { time: number; value: number }[] | undefined;
    setPnlHistory: React.Dispatch<
        React.SetStateAction<{ time: number; value: number }[] | undefined>
    >;
    accountValueHistory: { time: number; value: number }[] | undefined;
    setAccountValueHistory: React.Dispatch<
        React.SetStateAction<{ time: number; value: number }[] | undefined>
    >;
    userProfileLineData: any;
    setUserProfileLineData: React.Dispatch<React.SetStateAction<any>>;
    panelHeight?: number;
    isMobile?: boolean;
}

// Increased mobile chart height to show full content including labels
const MOBILE_CHART_HEIGHT = 280;

const TabChartContext: React.FC<TabChartContext> = (props) => {
    const {
        activeTab,
        selectedVault,
        selectedPeriod,
        pnlHistory,
        setPnlHistory,
        accountValueHistory,
        setAccountValueHistory,
        userProfileLineData,
        setUserProfileLineData,
        panelHeight,
        isMobile,
    } = props;

    const panelHeightRef = useRef(panelHeight);

    useEffect(() => {
        panelHeightRef.current = panelHeight;
    }, [panelHeight]);

    const { userAddress } = useUserDataStore();

    const { fetchUserHistory } = useInfoApi();

    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState<number | null>(null);
    const [chartHeight, setChartHeight] = useState<number | null>(null);
    const [isChartReady, setIsChartReady] = useState(false);

    const fetchUserHistoryRef = useRef(fetchUserHistory);
    useEffect(() => {
        fetchUserHistoryRef.current = fetchUserHistory;
    }, [fetchUserHistory]);

    const setPnlHistoryRef = useRef(setPnlHistory);
    useEffect(() => {
        setPnlHistoryRef.current = setPnlHistory;
    }, [setPnlHistory]);

    const setAccountValueHistoryRef = useRef(setAccountValueHistory);
    useEffect(() => {
        setAccountValueHistoryRef.current = setAccountValueHistory;
    }, [setAccountValueHistory]);

    const setUserProfileLineDataRef = useRef(setUserProfileLineData);
    useEffect(() => {
        setUserProfileLineDataRef.current = setUserProfileLineData;
    }, [setUserProfileLineData]);

    useEffect(() => {
        if (!userAddress) {
            return;
        }

        let isCancelled = false;

        const doFetch = async () => {
            try {
                const data = await fetchUserHistoryRef.current(userAddress);
                if (isCancelled) return;
                if (
                    data.pnlHistory.length === 0 &&
                    data.accountValueHistory.length === 0
                ) {
                    setPnlHistoryRef.current([]);
                    setAccountValueHistoryRef.current([]);
                    setUserProfileLineDataRef.current(data);
                    return;
                }

                setUserProfileLineDataRef.current(data);
            } catch (error) {
                if (!isCancelled) {
                    console.error('Failed to fetch user history:', error);
                }
            }
        };

        doFetch();

        const intervalId = setInterval(doFetch, 30 * 60 * 1000);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [userAddress]);

    useEffect(() => {
        window.addEventListener('resize', calculatePanelHeight);

        return () => {
            window.removeEventListener('resize', calculatePanelHeight);
        };
    }, []);

    useEffect(() => {
        calculatePanelHeight();
    }, [panelHeight, isMobile]);

    const calculatePanelHeight = useCallback(() => {
        const isMobileView = isMobile || window.innerWidth <= 768;

        if (!containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;

        if (isMobileView) {
            setChartWidth(Math.max(Math.min(containerWidth, 950), 250));
            setChartHeight(MOBILE_CHART_HEIGHT);
            setIsChartReady(true);
            return;
        }

        const containerHeight = containerRef.current.clientHeight;

        setChartWidth(Math.max(Math.min(containerWidth, 940), 250));
        setChartHeight(Math.max(containerHeight - 8, 180));
        setIsChartReady(true);
    }, [isMobile]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            calculatePanelHeight();
        });
        return () => cancelAnimationFrame(raf);
    }, [activeTab, calculatePanelHeight]);

    useEffect(() => {
        if (!userProfileLineData) return;
        const data = userProfileLineData;

        if (selectedPeriod.value === 'AllTime') {
            setPnlHistoryRef.current(data.pnlHistory);
            setAccountValueHistoryRef.current(data.accountValueHistory);
        } else {
            const boundaryDate = Date.now() - selectedPeriod.timeframe;

            const filteredPnlHistory = data.pnlHistory.filter(
                (pnl: any) => pnl.time >= boundaryDate,
            );
            const filteredAccountValueHistory = data.accountValueHistory.filter(
                (av: any) => av.time >= boundaryDate,
            );

            setPnlHistoryRef.current(filteredPnlHistory);
            setAccountValueHistoryRef.current(filteredAccountValueHistory);
        }
    }, [selectedPeriod, userProfileLineData]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                flex: 1,
                minHeight: 0,
                ...(isMobile
                    ? { minHeight: `${MOBILE_CHART_HEIGHT}px` }
                    : null),
                overflow: 'visible',
            }}
        >
            {isChartReady && chartWidth && chartHeight && (
                <>
                    {activeTab === 'performance' && pnlHistory && (
                        <div style={{ position: 'relative' }}>
                            <LineChart
                                // key={`performance-${chartWidth}-${chartHeight}`}
                                lineData={pnlHistory}
                                curve={'basic'}
                                chartName={
                                    selectedVault.value + selectedPeriod.value
                                }
                                height={chartHeight}
                                width={chartWidth}
                                isMobile={isMobile}
                            />
                            {pnlHistory.length === 0 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text2)',
                                        fontSize: 'var(--font-size-s)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    No history yet
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'accountValue' && accountValueHistory && (
                        <div style={{ position: 'relative' }}>
                            <LineChart
                                // key={`account-${chartWidth}-${chartHeight}`}
                                lineData={accountValueHistory}
                                curve={'basic'}
                                chartName={
                                    selectedVault.value + selectedPeriod.value
                                }
                                height={chartHeight}
                                width={chartWidth}
                                isMobile={isMobile}
                            />
                            {accountValueHistory.length === 0 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text2)',
                                        fontSize: 'var(--font-size-s)',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    No history yet
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'collateral' && (
                        <CollateralPieChart
                            key={`collateral-${chartWidth}-${chartHeight}`}
                            height={chartHeight}
                            width={chartWidth}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default TabChartContext;
