'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import DepositDropdown from '~/components/PageHeader/DepositDropdown/DepositDropdown';
import OrderInput from '~/components/Trade/OrderInput/OrderInput';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import TradingViewWrapper from '~/components/Tradingview/TradingviewWrapper';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { Route } from '../+types/root';
import styles from './trade.module.css';
import OrderBookSection from './trade/orderbook/orderbooksection';
import SymbolInfo from './trade/symbol/symbolinfo';
import TradeRouteHandler from './trade/traderoutehandler';
import WatchList from './trade/watchlist/watchlist';
import WebDataConsumer from './trade/webdataconsumer';

import ComboBoxContainer from '~/components/Inputs/ComboBox/ComboBoxContainer';
import AdvancedTutorialController from '~/components/Tutorial/AdvancedTutorialController';
import { useTutorial } from '~/hooks/useTutorial';

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}

// Memoize components that don't need frequent re-renders
const MemoizedOrderInput = memo(OrderInput);
const MemoizedTradeTable = memo(TradeTable);
const MemoizedTradingViewWrapper = memo(TradingViewWrapper);
const MemoizedOrderBookSection = memo(OrderBookSection);
const MemoizedSymbolInfo = memo(SymbolInfo);

type TabType = 'order' | 'chart' | 'book' | 'recent' | 'positions';

export default function Trade() {
    const { symbol } = useTradeDataStore();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;
    const { orderBookMode } = useAppSettings();
    const { marketId } = useParams<{ marketId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('order');
    const [isMobile, setIsMobile] = useState<boolean>(false);

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

    const switchTab = useCallback(
        (tab: TabType) => {
            if (activeTab === tab) return;

            // Update visibility refs for lazy loading
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
        document.body.style.overscrollBehaviorX = 'none';
        document.body.style.touchAction = 'pan-y';
        return () => {
            document.body.style.overscrollBehaviorX = 'auto';
            document.body.style.touchAction = 'auto';
        };
    }, []);

    useEffect(() => {
        if (!marketId)
            navigate(`/trade/${symbol}`, {
                replace: true,
                viewTransition: true,
            });
    }, [navigate, marketId, symbol]);

    const { showTutorial, handleTutorialComplete, handleTutorialSkip } =
        useTutorial();

    const MobileTabNavigation = useMemo(() => {
        return (
            <div className={styles.mobileTabNav}>
                <div className={styles.mobileTabBtns}>
                    <button
                        className={`${styles.mobileTabBtn} ${activeTab === 'order' ? styles.active : ''}`}
                        onClick={() => switchTab('order')}
                    >
                        Order
                    </button>
                    <button
                        className={`${styles.mobileTabBtn} ${activeTab === 'chart' ? styles.active : ''}`}
                        onClick={() => switchTab('chart')}
                    >
                        Chart
                    </button>
                    <button
                        className={`${styles.mobileTabBtn} ${activeTab === 'book' ? styles.active : ''}`}
                        onClick={() => switchTab('book')}
                    >
                        Book
                    </button>
                    <button
                        className={`${styles.mobileTabBtn} ${activeTab === 'recent' ? styles.active : ''}`}
                        onClick={() => switchTab('recent')}
                    >
                        Recent
                    </button>
                    <button
                        className={`${styles.mobileTabBtn} ${activeTab === 'positions' ? styles.active : ''}`}
                        onClick={() => switchTab('positions')}
                    >
                        Positions
                    </button>
                </div>
            </div>
        );
    }, [activeTab, switchTab]);

    // Mobile views with lazy loading
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

                {/* Order section - only render when active or was active */}
                <div
                    className={`${styles.mobileSection} ${styles.mobileOrder} ${activeTab === 'order' ? styles.active : ''}`}
                    style={{
                        display: activeTab === 'order' ? 'block' : 'none',
                    }}
                >
                    {(activeTab === 'order' ||
                        visibilityRefs.current.order) && <MemoizedOrderInput />}
                </div>

                {/* Chart section */}
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

                {/* Book section - Shows ONLY Order Book */}
                <div
                    className={`${styles.mobileSection} ${styles.mobileBook} ${activeTab === 'book' ? styles.active : ''}`}
                    style={{ display: activeTab === 'book' ? 'block' : 'none' }}
                >
                    {activeTab === 'book' && mobileOrderBookView}
                </div>

                {/* Recent trades section - Shows ONLY Recent Trades */}
                <div
                    className={`${styles.mobileSection} ${styles.mobileRecent} ${activeTab === 'recent' ? styles.active : ''}`}
                    style={{
                        display: activeTab === 'recent' ? 'block' : 'none',
                    }}
                >
                    {activeTab === 'recent' && mobileRecentTradesView}
                </div>

                {/* Positions section */}
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
                <div className={styles.container}>
                    <section
                        className={`${styles.containerTop} ${orderBookMode === 'large' ? styles.orderBookLarge : ''}`}
                    >
                        <div
                            className={`${styles.containerTopLeft} ${styles.symbolSectionWrapper}`}
                        >
                            <ComboBoxContainer />
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

                        <div id='orderBookSection' className={styles.orderBook}>
                            <MemoizedOrderBookSection symbol={symbol} />
                        </div>
                        <div
                            id='tradeModulesSection'
                            className={styles.tradeModules}
                        >
                            <MemoizedOrderInput />
                        </div>
                    </section>
                    <section
                        id={'bottomSection'}
                        className={styles.containerBottom}
                    >
                        <div className={styles.table} id='tutorial-trade-table'>
                            <MemoizedTradeTable />
                        </div>
                        <div className={styles.wallet}>
                            <DepositDropdown
                                isUserConnected={false}
                                setIsUserConnected={() =>
                                    console.log('connected')
                                }
                            />
                        </div>
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
