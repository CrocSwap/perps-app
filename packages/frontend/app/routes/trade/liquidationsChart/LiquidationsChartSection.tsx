import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './LiquidationsChartSection.module.css';
import Tabs from '~/components/Tabs/Tabs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import LiquidationsChart from './LiqChar';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import type {
    OrderBookMode,
    OrderBookRowIF,
    OrderRowResolutionIF,
} from '~/utils/orderbook/OrderBookIFs';
import {
    createRandomOrderBookLiq,
    getResolutionListForSymbol,
    interpolateOrderBookData,
} from '~/utils/orderbook/OrderBookUtils';

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
        highResBuys,
        highResSells,
        setHighResBuys,
        setHighResSells,
        selectedResolution,
        selectedMode,
        orderBookState,
        setSelectedResolution,
        setSelectedMode,
        liqBuys,
        liqSells,
        setLiqBuys,
        setLiqSells,
    } = useOrderBookStore();
    const { symbolInfo } = useTradeDataStore();

    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
    const tabContentRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const liquidationsChartTabs = useMemo(() => ['Distribution', 'Feed'], []);
    const [activeTab, setActiveTab] = useState(liquidationsChartTabs[0]);

    const buysRef = useRef<OrderBookRowIF[]>([]);
    const sellsRef = useRef<OrderBookRowIF[]>([]);
    buysRef.current = buys;
    sellsRef.current = sells;

    const handleTabChange = useCallback((tab: string) => setActiveTab(tab), []);

    const genRandomData = useCallback(() => {
        const highResBuys = interpolateOrderBookData(buysRef.current);
        const highResSells = interpolateOrderBookData(sellsRef.current);
        setHighResBuys(highResBuys);
        setHighResSells(highResSells);
        const { liqBuys, liqSells } = createRandomOrderBookLiq(
            buysRef.current,
            sellsRef.current,
        );
        setLiqBuys(liqBuys);
        setLiqSells(liqSells);
    }, [setHighResBuys, setHighResSells, setLiqBuys, setLiqSells]);

    useEffect(() => {
        genRandomData();
        const randomDataInterval = setInterval(() => {
            genRandomData();
        }, 1000);

        return () => clearInterval(randomDataInterval);
    }, []);

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
            if (tabContentRef.current) {
                const rect = tabContentRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height - 40 });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const orderCount = useMemo(() => {
        if (!highResBuys.length) return 30;
        return highResBuys.length;
    }, [highResBuys]);

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
            if (orderBookState === TableState.LOADING) {
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

            if (
                orderBookState === TableState.FILLED &&
                highResBuys.length > 0 &&
                highResSells.length > 0
            ) {
                return (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <LiquidationsChart
                            buyData={highResBuys}
                            sellData={highResSells}
                            liqBuys={liqBuys}
                            liqSells={liqSells}
                            width={dimensions.width}
                            height={dimensions.height}
                        />
                    </motion.div>
                );
            }
        }
        return <div>Feed</div>;
    }, [activeTab, highResBuys, highResSells, dimensions, orderBookState]);

    const liqChartTabsComponent = (
        <div className={styles.liqChartTabContainer}>
            <Tabs
                wrapperId='liquidationsChartTabs'
                tabs={liquidationsChartTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
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
                <div className={styles.startGap} />
                {renderTabContent()}
            </div>
        </div>
    );

    return (
        <div className={styles.liqChartSectionContainer}>
            {liqChartTabsComponent}
        </div>
    );
};

export default LiquidationsChartSection;
