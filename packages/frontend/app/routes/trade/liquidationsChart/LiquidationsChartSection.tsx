import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import Tabs from '~/components/Tabs/Tabs';
import { useDebugStore } from '~/stores/DebugStore';
import { LiqChartTabType, useLiqChartStore } from '~/stores/LiqChartStore';
import { useLiquidationStore } from '~/stores/LiquidationStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import type {
    OrderBookRowIF,
    OrderRowResolutionIF,
} from '~/utils/orderbook/OrderBookIFs';
import { getResolutionListForSymbol } from '~/utils/orderbook/OrderBookUtils';
import LiquidationsChart from './LiquidationOBChart';
import styles from './LiquidationsChartSection.module.css';
import OBLiqFetcher from './ObLiqFetcher';

interface LiquidationsChartSectionProps {
    symbol: string;
    mobileView?: boolean;
    mobileContent?: 'orderBook' | 'recentTrades';
}

const LiquidationsChartSection: React.FC<LiquidationsChartSectionProps> = ({
    symbol,
}) => {
    const {
        buys,
        sells,
        selectedResolution,
        selectedMode,
        setSelectedResolution,
        setSelectedMode,
        orderCount,
        activeOrderTab,
        obMaxSell,
        obMinBuy,
        obMinSell,
        obMaxBuy,
        addToResolutionPair,
    } = useOrderBookStore();
    const { symbolInfo } = useTradeDataStore();
    const symbolInfoRef = useRef(symbolInfo);
    symbolInfoRef.current = symbolInfo;
    const { loadingState } = useLiquidationStore();

    const obMinSellRef = useRef<number>(obMinSell);
    obMinSellRef.current = obMinSell;
    const obMaxBuyRef = useRef<number>(obMaxBuy);
    obMaxBuyRef.current = obMaxBuy;

    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
    const tabContentRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const { activeTab, setActiveTab } = useLiqChartStore();

    // const [chartMode, setChartMode] = useState<'distribution' | 'cumulative'>(
    //     'cumulative',
    // );

    const chartMode = 'cumulative';

    const buysRef = useRef<OrderBookRowIF[]>([]);
    const sellsRef = useRef<OrderBookRowIF[]>([]);
    buysRef.current = buys;
    sellsRef.current = sells;

    const { buyLiqs, sellLiqs } = useLiquidationStore();

    const buyLiqsFilteredOB = useMemo(() => {
        let filteredBuyLiqs = buyLiqs.filter((liq) => liq.px >= obMinBuy);

        if (
            filteredBuyLiqs.length > 0 &&
            obMinSellRef.current > 0 &&
            obMaxBuyRef.current > 0
        ) {
            const markPx = symbolInfoRef.current?.markPx || 0;
            filteredBuyLiqs = [
                {
                    px: markPx,
                    sz: 0,
                    type: 'buy',
                    ratio: 0,
                    cumulativeSz: 0,
                    cumulativeRatio: 0,
                },
                ...filteredBuyLiqs,
            ];
        }
        return filteredBuyLiqs;
    }, [buyLiqs, obMinBuy]);

    const sellLiqsFilteredOB = useMemo(() => {
        let filteredSellLiqs = sellLiqs.filter((liq) => liq.px <= obMaxSell);

        if (
            filteredSellLiqs.length > 0 &&
            obMinSellRef.current > 0 &&
            obMaxBuyRef.current > 0
        ) {
            const markPx = symbolInfoRef.current?.markPx || 0;
            filteredSellLiqs = [
                {
                    px: markPx,
                    sz: 0,
                    type: 'sell',
                    ratio: 0,
                    cumulativeSz: 0,
                    cumulativeRatio: 0,
                },
                ...filteredSellLiqs,
            ];
        }
        return filteredSellLiqs;
    }, [sellLiqs, obMaxSell]);

    // Find max sz across all liq levels (both buy and sell sides)
    const maxLiqSz = useMemo(() => {
        const allLiqs = [...buyLiqs, ...sellLiqs];
        if (allLiqs.length === 0) return 0;
        return Math.max(...allLiqs.map((liq) => liq.sz));
    }, [buyLiqs, sellLiqs]);

    // Create discrete liq arrays mapped to orderbook slots (summing sz within each slot's price range)
    const slottedLiqBuys = useMemo(() => {
        const slicedBuys = buys.slice(0, orderCount);

        // Map slots with sz and count for averaging
        const slotsWithSz = slicedBuys.map((slot, index) => {
            const nextSlotPx = slicedBuys[index + 1]?.px ?? 0;
            const matchingLiqs = buyLiqsFilteredOB.filter(
                (liq) => liq.px <= slot.px && liq.px > nextSlotPx,
            );
            const summedSz = matchingLiqs.reduce((acc, liq) => acc + liq.sz, 0);
            const count = matchingLiqs.length;
            const avgSz = count > 0 ? summedSz / count : 0;
            return { px: slot.px, sz: summedSz, avgSz, type: 'buy' as const };
        });

        // Calculate ratio using average sz / maxLiqSz
        return slotsWithSz.map((slot) => ({
            ...slot,
            ratio: maxLiqSz > 0 ? slot.avgSz / maxLiqSz : 0,
        }));
    }, [buys, buyLiqsFilteredOB, maxLiqSz, orderCount]);

    const slottedLiqSells = useMemo(() => {
        const slicedSells = sells.slice(0, orderCount);

        // Map slots with sz and count for averaging
        const slotsWithSz = slicedSells.map((slot, index) => {
            const nextSlotPx = slicedSells[index + 1]?.px ?? Infinity;
            const matchingLiqs = sellLiqsFilteredOB.filter(
                (liq) => liq.px >= slot.px && liq.px < nextSlotPx,
            );
            const summedSz = matchingLiqs.reduce((acc, liq) => acc + liq.sz, 0);
            const count = matchingLiqs.length;
            const avgSz = count > 0 ? summedSz / count : 0;
            return { px: slot.px, sz: summedSz, avgSz, type: 'sell' as const };
        });

        // Calculate ratio using average sz / maxLiqSz
        return slotsWithSz
            .map((slot) => ({
                ...slot,
                ratio: maxLiqSz > 0 ? slot.avgSz / maxLiqSz : 0,
            }))
            .reverse();
    }, [sells, sellLiqsFilteredOB, maxLiqSz, orderCount]);

    const handleTabChange = useCallback(
        (tab: LiqChartTabType) => setActiveTab(tab),
        [setActiveTab],
    );
    const { pauseLiqAnimation } = useDebugStore();
    const pauseLiqAnimationRef = useRef(pauseLiqAnimation);
    pauseLiqAnimationRef.current = pauseLiqAnimation;

    useEffect(() => {
        if (symbol === symbolInfo?.coin) {
            const resolutionList = getResolutionListForSymbol(symbolInfo);
            setResolutions(resolutionList);
            if (!selectedResolution) {
                setSelectedResolution(resolutionList[0]);
            }
        }
    }, [symbol, symbolInfo?.coin, selectedResolution, setSelectedResolution]);

    useEffect(() => {
        const updateDimensions = () => {
            setTimeout(() => {
                if (tabContentRef.current) {
                    const rect = tabContentRef.current.getBoundingClientRect();
                    let height = rect.height;
                    const slotsWrapper = document.getElementById(
                        'orderBookSlotsWrapper',
                    );

                    if (slotsWrapper) {
                        const slotsWrapperHeight =
                            slotsWrapper.getBoundingClientRect().height;
                        height = slotsWrapperHeight;
                    }

                    setDimensions({ width: rect.width, height: height });
                }
            }, 200);
        };

        window.addEventListener('resize', updateDimensions);

        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, [orderCount, loadingState]);

    const getRandWidth = useCallback(
        (index: number, inverse: boolean = false) => {
            let rand;
            if (inverse) {
                rand =
                    100 / orderCount +
                    index * (100 / orderCount) +
                    Math.random() * 20;
            } else {
                rand = 100 - index * (100 / orderCount) + Math.random() * 20;
            }
            return rand < 100 ? rand + '%' : '100%';
        },
        [orderCount],
    );

    const renderTabContent = useCallback(() => {
        if (activeTab === 'Distribution') {
            if (loadingState === TableState.LOADING) {
                return (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            gap: '4px',
                        }}
                    >
                        {Array.from({ length: orderCount }).map((_, index) => (
                            <SkeletonNode
                                width={getRandWidth(index)}
                                height='16px'
                            />
                        ))}
                        {Array.from({ length: orderCount }).map((_, index) => (
                            <SkeletonNode
                                width={getRandWidth(index, true)}
                                height='16px'
                            />
                        ))}
                    </motion.div>
                );
            }

            if (loadingState === TableState.FILLED) {
                const hasBuyData = buyLiqsFilteredOB.length > 0;
                const hasSellData = sellLiqsFilteredOB.length > 0;

                // Both empty - show full empty state
                if (!hasBuyData && !hasSellData) {
                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className={styles.chartWrapper}
                        >
                            <div className={styles.emptyStateCenter}>
                                <span>No liquidation data available</span>
                            </div>
                        </motion.div>
                    );
                }

                return (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className={styles.chartWrapper}
                    >
                        <LiquidationsChart
                            buyData={buyLiqsFilteredOB}
                            sellData={sellLiqsFilteredOB}
                            liqBuys={slottedLiqBuys}
                            liqSells={slottedLiqSells}
                            width={dimensions.width}
                            height={dimensions.height}
                            location={'obBook'}
                            chartMode={chartMode}
                        />
                        {/* <button
                            className={styles.modeButton}
                            onClick={() =>
                                setChartMode(
                                    chartMode === 'distribution'
                                        ? 'cumulative'
                                        : 'distribution',
                                )
                            }
                        >
                            {chartMode === 'distribution'
                                ? 'Distribution'
                                : 'Cumulative'}
                        </button> */}
                    </motion.div>
                );
            }
        }
        return <div>Feed</div>;
    }, [
        activeTab,
        buyLiqsFilteredOB,
        sellLiqsFilteredOB,
        slottedLiqBuys,
        slottedLiqSells,
        dimensions,
        loadingState,
        chartMode,
    ]);

    const liqChartTabsComponent = (
        <div className={styles.liqChartTabContainer}>
            <Tabs
                wrapperId='liquidationsChartTabs'
                tabs={Object.values(LiqChartTabType).map((tab) =>
                    tab.toString(),
                )}
                defaultTab={activeTab}
                onTabChange={(tab) => handleTabChange(tab as LiqChartTabType)}
                wide
                flex
            />
            <div className={styles.liqChartControls}>
                <ComboBox
                    value={selectedResolution?.val}
                    options={resolutions}
                    fieldName='val'
                    onChange={(value) => {
                        const resolution = resolutions.find(
                            (resolution) => resolution.val === Number(value),
                        );
                        if (resolution) {
                            setSelectedResolution(resolution);
                            addToResolutionPair(symbol, resolution);
                        }
                    }}
                />
                <ComboBox
                    value={
                        selectedMode === 'symbol' ? symbol.toUpperCase() : 'USD'
                    }
                    options={[symbol.toUpperCase(), 'USD']}
                    onChange={(value) =>
                        setSelectedMode(
                            value === symbol.toUpperCase() ? 'symbol' : 'usd',
                        )
                    }
                />
            </div>
            <div ref={tabContentRef} className={styles.tabContent}>
                {(activeOrderTab.includes('book') ||
                    activeOrderTab === 'Book') && (
                    <div className={styles.startGap}>Liquidation Chart</div>
                )}
                {renderTabContent()}
            </div>
        </div>
    );

    return (
        <div className={styles.liqChartSectionContainer}>
            <OBLiqFetcher />
            {liqChartTabsComponent}
        </div>
    );
};

export default LiquidationsChartSection;
