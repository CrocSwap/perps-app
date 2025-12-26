import { useEffect, useState, useRef, useCallback } from 'react';
import LineChart from '~/components/LineChart/LineChart';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useUserDataStore } from '~/stores/UserDataStore';
import type { UserPositionIF } from '~/utils/UserDataIFs';
import CollateralPieChart from '../CollateralChart/CollateralPieChart';
import { positionDataMap } from './LineChartData';

export interface TabChartContext {
    activeTab: string;
    selectedVault: { label: string; value: string };
    selectedPeriod: { label: string; value: string };
    isLineDataFetched: boolean;
    handleLineDataFetched: (isDataFetched: boolean) => void;
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
const MOBILE_CHART_WIDTH_PADDING = 32;

const TabChartContext: React.FC<TabChartContext> = (props) => {
    const {
        activeTab,
        selectedVault,
        selectedPeriod,
        isLineDataFetched,
        handleLineDataFetched,
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

    const { fetchUserPortfolio } = useInfoApi();

    const [parsedKey, setParsedKey] = useState<string>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState<number | null>(null);
    const [chartHeight, setChartHeight] = useState<number | null>(null);
    const [isChartReady, setIsChartReady] = useState(false);

    const parseFakeUserData = (key: string) => {
        const userPositionData = positionDataMap.get(key);

        if (userPositionData !== undefined) {
            setAccountValueHistory(() => userPositionData.accountValueHistory);
            setPnlHistory(() => userPositionData.pnlHistory);

            setParsedKey(() => key);
        }
    };

    const parseUserProfileData = (data: any, key: string) => {
        const userPositionData = data.get(key) as UserPositionIF;

        if (userPositionData.accountValueHistory) {
            const accountValueHistory =
                userPositionData.accountValueHistory.map((accountValue) => {
                    return {
                        time: accountValue[0],
                        value: Number(accountValue[1]),
                    };
                });

            setAccountValueHistory(() => accountValueHistory);
        }

        if (userPositionData.pnlHistory) {
            const pnlHistory = userPositionData.pnlHistory.map((pnlValue) => {
                return {
                    time: pnlValue[0],
                    value: Number(pnlValue[1]),
                };
            });

            setPnlHistory(() => pnlHistory);
        }

        setParsedKey(() => key);
    };

    useEffect(() => {
        if (userAddress && !isLineDataFetched) {
            fetchUserPortfolio(userAddress).then((data) => {
                setUserProfileLineData(() => data);

                handleLineDataFetched(true);
            });
        }
    }, [userAddress, isLineDataFetched]);

    useEffect(() => {
        const key =
            selectedVault.value === 'perp'
                ? 'perp' + selectedPeriod.value
                : selectedPeriod.value === 'AllTime'
                  ? 'allTime'
                  : selectedPeriod.value?.toLowerCase();

        // if (key !== parsedKey && userProfileLineData) {
        //     parseUserProfileData(userProfileLineData, key);
        // }

        // fake data parser

        if (key !== parsedKey) {
            parseFakeUserData(key);
        }
    }, [
        userProfileLineData,
        selectedVault.value,
        selectedPeriod.value,
        activeTab,
    ]);

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

        if (isMobileView) {
            setChartWidth(
                Math.max(window.innerWidth - MOBILE_CHART_WIDTH_PADDING, 250),
            );
            setChartHeight(MOBILE_CHART_HEIGHT);
            setIsChartReady(true);
            return;
        }

        if (panelHeightRef.current === undefined) return;

        const header = document.getElementById('portfolio-header-container');

        const performanceTabs = document.getElementById('performanceTabs');

        const metricsContainer = document.getElementById('metricsContainer');

        const headerHeight = header ? header.clientHeight : 30;

        const headerWidth = header ? header.clientWidth : 0;

        const metricsContainerWidth = metricsContainer
            ? metricsContainer.clientWidth
            : 0;

        const performanceTabsWidth = performanceTabs
            ? performanceTabs.clientWidth
            : 0;

        const performanceTabsHeight = performanceTabs
            ? performanceTabs.clientHeight
            : 25;

        const calculatedChartHeight =
            panelHeightRef.current - headerHeight - performanceTabsHeight - 10;

        if (
            window.innerWidth < 1280 + 50 &&
            performanceTabsWidth + 50 > window.innerWidth
        ) {
            setChartWidth(
                Math.min(
                    950,
                    Math.max(
                        window.innerWidth - metricsContainerWidth - 50,
                        250,
                    ),
                ),
            );
        } else {
            setChartWidth(Math.min(950, Math.max(headerWidth, 250)));
        }

        setChartHeight(calculatedChartHeight);
        setIsChartReady(true);
    }, [isMobile]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: isMobile ? 'auto' : '100%',
                minHeight: isMobile ? `${MOBILE_CHART_HEIGHT}px` : undefined,
                overflow: 'visible',
            }}
        >
            {isChartReady && chartWidth && chartHeight && (
                <>
                    {activeTab === 'Performance' && pnlHistory && (
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
                    )}

                    {activeTab === 'Account Value' && accountValueHistory && (
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
                    )}

                    {activeTab === 'Collateral' && (
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
