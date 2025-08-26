import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import DepositDropdown from '~/components/PageHeader/DepositDropdown/DepositDropdown';
import OrderInput from '~/components/Trade/OrderInput/OrderInput';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import TradingViewWrapper from '~/components/Tradingview/TradingviewWrapper';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './trade.module.css';
import OrderBookSection from './trade/orderbook/orderbooksection';
import SymbolInfo from './trade/symbol/symbolinfo';
import TradeRouteHandler from './trade/traderoutehandler';
import WatchList from './trade/watchlist/watchlist';
import WebDataConsumer from './trade/webdataconsumer';

import { motion } from 'framer-motion';
import ComboBoxContainer from '~/components/Inputs/ComboBox/ComboBoxContainer';
import AdvancedTutorialController from '~/components/Tutorial/AdvancedTutorialController';
import { useTutorial } from '~/hooks/useTutorial';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { useAppStateStore } from '~/stores/AppStateStore';
import { usePortfolioModals } from './portfolio/usePortfolioModals';
import LiquidationsChartSection from './trade/liquidationsChart/LiquidationsChartSection';

// Memoize components that don't need frequent re-renders
const MemoizedTradeTable = memo(TradeTable);
const MemoizedTradingViewWrapper = memo(TradingViewWrapper);
const MemoizedOrderBookSection = memo(OrderBookSection);
const MemoizedSymbolInfo = memo(SymbolInfo);

type TabType = 'order' | 'chart' | 'book' | 'recent' | 'positions';

export default function Trade() {
    const { symbol } = useTradeDataStore();
    const { marginBucket } = useUnifiedMarginData();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;
    const { orderBookMode } = useAppSettings();
    const { marketId } = useParams<{ marketId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('order');
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const { debugToolbarOpen, setDebugToolbarOpen, liquidationsActive } =
        useAppStateStore();
    const debugToolbarOpenRef = useRef(debugToolbarOpen);
    debugToolbarOpenRef.current = debugToolbarOpen;

    const visibilityRefs = useRef<{
        order: boolean;
        chart: boolean;
        book: boolean;
        recent: boolean;
        positions: boolean;
    }>({
        order: false,
        chart: false,
        book: false,
        recent: false,
        positions: false,
    });

    useEffect(() => {
        const checkIfMobile = () => {
            if (window.innerWidth <= 768 !== isMobile) {
                setIsMobile(window.innerWidth <= 768);
            }
        };

        checkIfMobile();

        let resizeTimer: NodeJS.Timeout | undefined;
        const handleResize = () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(checkIfMobile, 100);
        };

        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            clearTimeout(resizeTimer);
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobile]);

    // Memoize switchTab so it's always stable
    const switchTab = useCallback(
        (tab: TabType) => {
            if (activeTab === tab) return;
            visibilityRefs.current = {
                order: tab === 'order',
                chart: tab === 'chart',
                book: tab === 'book',
                recent: tab === 'recent',
                positions: tab === 'positions',
            };
            requestAnimationFrame(() => {
                setActiveTab(tab);
            });
        },
        [activeTab],
    );

    useEffect(() => {
        const keydownHandler = (e: KeyboardEvent) => {
            if (e.code === 'KeyD' && e.altKey) {
                e.preventDefault();
                setDebugToolbarOpen(!debugToolbarOpenRef.current);
            }
        };

        window.addEventListener('keydown', keydownHandler);

        return () => {
            window.removeEventListener('keydown', keydownHandler);
        };
    }, []);

    useEffect(() => {
        document.body.style.overscrollBehaviorX = 'none';
        document.body.style.touchAction = 'pan-y';
        return () => {
            document.body.style.overscrollBehaviorX = 'auto';
            document.body.style.touchAction = 'auto';
        };
    }, []);

    useEffect(() => {
        if (!marketId)
            navigate(`/v2/trade/${symbol}`, {
                replace: true,
                viewTransition: true,
            });
    }, [navigate, marketId, symbol]);

    const { showTutorial, handleTutorialComplete, handleTutorialSkip } =
        useTutorial();

    // Tab list and handlers
    const tabList: { key: TabType; label: string }[] = useMemo(
        () => [
            { key: 'order', label: 'Order' },
            { key: 'chart', label: 'Chart' },
            { key: 'book', label: 'Book' },
            { key: 'recent', label: 'Recent' },
            { key: 'positions', label: 'Positions' },
        ],
        [],
    );

    // Stable tab click handler
    const handleTabClick = useCallback(
        (tab: TabType) => () => switchTab(tab),
        [switchTab],
    );

    // Memoized tab navigation
    const MobileTabNavigation = useMemo(
        () => (
            <div className={styles.mobileTabNav}>
                <div className={styles.mobileTabBtns}>
                    {tabList.map(({ key, label }) => (
                        <button
                            key={key}
                            className={`${styles.mobileTabBtn} ${activeTab === key ? styles.active : ''}`}
                            onClick={handleTabClick(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        ),
        [activeTab, handleTabClick, tabList],
    );

    // Memoize mobile views with all relevant dependencies
    const mobileOrderBookView = useMemo(
        () => (
            <div className={styles.mobileOnlyOrderBook}>
                {(activeTab === 'book' || visibilityRefs.current.book) && (
                    <MemoizedOrderBookSection
                        symbol={symbol}
                        mobileView={true}
                        mobileContent='orderBook'
                    />
                )}
            </div>
        ),
        [symbol, activeTab],
    );

    const mobileRecentTradesView = useMemo(
        () => (
            <div className={styles.mobileOnlyRecentTrades}>
                {(activeTab === 'recent' || visibilityRefs.current.recent) && (
                    <MemoizedOrderBookSection
                        symbol={symbol}
                        mobileView={true}
                        mobileContent='recentTrades'
                    />
                )}
            </div>
        ),
        [symbol, activeTab],
    );

    const {
        openDepositModal,
        openWithdrawModal,
        PortfolioModalsRenderer,
        isAnyPortfolioModalOpen,
    } = usePortfolioModals();

    // Mobile view
    if (isMobile && symbol) {
        return (
            <>
                <TradeRouteHandler />
                <WebDataConsumer />
                <div className={styles.symbolInfoContainer}>
                    <MemoizedSymbolInfo />
                </div>
                {MobileTabNavigation}
                <div
                    className={`${styles.mobileSection} ${styles.mobileOrder} ${activeTab === 'order' ? styles.active : ''}`}
                    style={{
                        display: activeTab === 'order' ? 'block' : 'none',
                    }}
                >
                    {(activeTab === 'order' ||
                        visibilityRefs.current.order) && (
                        <OrderInput
                            marginBucket={marginBucket}
                            isAnyPortfolioModalOpen={isAnyPortfolioModalOpen}
                        />
                    )}
                </div>
                <div
                    className={`${styles.mobileSection} ${styles.mobileChart} ${activeTab === 'chart' ? styles.active : ''}`}
                    style={{
                        display: activeTab === 'chart' ? 'block' : 'none',
                    }}
                >
                    {(activeTab === 'chart' ||
                        visibilityRefs.current.chart) && (
                        <MemoizedTradingViewWrapper />
                    )}
                </div>
                <div
                    className={`${styles.mobileSection} ${styles.mobileBook} ${activeTab === 'book' ? styles.active : ''}`}
                    style={{ display: activeTab === 'book' ? 'block' : 'none' }}
                >
                    {activeTab === 'book' && mobileOrderBookView}
                </div>
                <div
                    className={`${styles.mobileSection} ${styles.mobileRecent} ${activeTab === 'recent' ? styles.active : ''}`}
                    style={{
                        display: activeTab === 'recent' ? 'block' : 'none',
                    }}
                >
                    {activeTab === 'recent' && mobileRecentTradesView}
                </div>
                <div
                    className={`${styles.mobileSection} ${styles.mobilePositions} ${activeTab === 'positions' ? styles.active : ''}`}
                    style={{
                        display: activeTab === 'positions' ? 'block' : 'none',
                    }}
                >
                    {(activeTab === 'positions' ||
                        visibilityRefs.current.positions) && (
                        <MemoizedTradeTable />
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <TradeRouteHandler />
            <WebDataConsumer />
            {symbol && (
                <div className={styles.containerNew}>
                    <section
                        className={`${styles.containerTop} ${orderBookMode === 'large' ? styles.orderBookLarge : ''}`}
                    >
                        <div
                            className={`${styles.chartLayout} ${liquidationsActive ? styles.liqActive : ''}`}
                        >
                            <div
                                id='trade-page-left-section'
                                className={`${styles.containerTopLeft} ${styles.symbolSectionWrapper} ${debugToolbarOpen ? styles.debugToolbarOpen : ''}`}
                            >
                                {debugToolbarOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={`${styles.debugToolbar} ${debugToolbarOpen ? styles.open : ''}`}
                                    >
                                        <ComboBoxContainer />
                                    </motion.div>
                                )}
                                <div
                                    id='watchlistSection'
                                    className={styles.watchlist}
                                >
                                    <WatchList />
                                </div>
                                <div
                                    id='symbolInfoSection'
                                    className={styles.symbolInfo}
                                >
                                    <MemoizedSymbolInfo />
                                </div>
                                <div id='chartSection' className={styles.chart}>
                                    <MemoizedTradingViewWrapper />
                                </div>
                            </div>
                            {liquidationsActive && (
                                <motion.div
                                    id='liquidationsChart'
                                    className={styles.liquidationsChart}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <LiquidationsChartSection symbol={symbol} />
                                </motion.div>
                            )}
                        </div>
                        <div id='orderBookSection' className={styles.orderBook}>
                            <MemoizedOrderBookSection symbol={symbol} />
                        </div>
                    </section>
                    <section className={styles.table} id='tutorial-trade-table'>
                        <MemoizedTradeTable />
                    </section>
                    <section className={styles.order_input}>
                        <OrderInput
                            marginBucket={marginBucket}
                            isAnyPortfolioModalOpen={isAnyPortfolioModalOpen}
                        />
                    </section>
                    <section className={styles.wallet}>
                        <DepositDropdown
                            marginBucket={marginBucket}
                            openDepositModal={openDepositModal}
                            openWithdrawModal={openWithdrawModal}
                            PortfolioModalsRenderer={PortfolioModalsRenderer}
                        />
                    </section>
                </div>
            )}
            <AdvancedTutorialController
                isEnabled={showTutorial}
                onComplete={handleTutorialComplete}
                onSkip={handleTutorialSkip}
            />
        </>
    );
}
