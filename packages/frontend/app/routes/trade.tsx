import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import { Resizable } from 're-resizable';
import type { NumberSize } from 're-resizable';
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
import { getSizePercentageSegment } from '~/utils/functions/getSegment';
import { useTranslation } from 'react-i18next';
import LiquidationsChartSection from './trade/liquidationsChart/LiquidationsChartSection';
import useOutsideClick from '~/hooks/useOutsideClick';
import ExpandableOrderBook from './trade/orderbook/ExpandableOrderBook';

const MemoizedTradeTable = memo(TradeTable);
const MemoizedTradingViewWrapper = memo(TradingViewWrapper);
const MemoizedOrderBookSection = memo(OrderBookSection);
const MemoizedSymbolInfo = memo(SymbolInfo);

export type TabType = 'order' | 'chart' | 'book' | 'recent' | 'positions';

export default function Trade() {
    const { symbol, selectedTradeTab, setSelectedTradeTab } =
        useTradeDataStore();
    // Mobile-only dropdown state
    type PortfolioViewKey =
        | 'common.positions'
        | 'common.balances'
        | 'common.openOrders'
        | 'common.tradeHistory'
        | 'common.orderHistory';

    // mobile Positions tab dropdown
    const [positionsMenuOpen, setPositionsMenuOpen] = useState(false);

    // close when clicking outside Positions tab + menu
    const posWrapRef = useOutsideClick<HTMLDivElement>(
        () => setPositionsMenuOpen(false),
        positionsMenuOpen,
    );
    useEffect(() => {
        if (!positionsMenuOpen) return;
        const onKey = (e: KeyboardEvent) =>
            e.key === 'Escape' && setPositionsMenuOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [positionsMenuOpen]);

    // Label map (swap to i18n if you want)
    const MOBILE_VIEW_LABELS: Record<PortfolioViewKey, string> = {
        'common.positions': 'Positions',
        'common.balances': 'Balances',
        'common.openOrders': ' Orders',
        'common.tradeHistory': 'Transactions',
        'common.orderHistory': 'History',
    };

    // In case selectedTradeTab is something not in our mobile list, default the button label:
    const currentMobileLabel =
        MOBILE_VIEW_LABELS[selectedTradeTab as PortfolioViewKey] ?? 'Positions';

    // The list of mobile options (order = how the menu shows)
    const MOBILE_OPTIONS: PortfolioViewKey[] = [
        'common.positions',
        'common.balances',
        'common.openOrders',
        'common.tradeHistory',
        'common.orderHistory',
    ];
    const { marginBucket } = useUnifiedMarginData();
    const { t } = useTranslation();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;
    // add refs near the other refs
    const lastColHeightRef = useRef<number | null>(null);
    const lastWinInnerHeightRef = useRef<number>(
        typeof window !== 'undefined' ? window.innerHeight : 0,
    );

    const {
        orderBookMode,
        chartTopHeight: storedHeight,
        setChartTopHeight,
        resetLayoutHeights,
    } = useAppSettings();

    const { marketId } = useParams<{ marketId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('order');
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const { debugToolbarOpen, setDebugToolbarOpen, liquidationsActive } =
        useAppStateStore();
    const debugToolbarOpenRef = useRef(debugToolbarOpen);
    debugToolbarOpenRef.current = debugToolbarOpen;

    const visibilityRefs = useRef({
        order: false,
        chart: false,
        book: false,
        recent: false,
        positions: false,
    });

    useLayoutEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const update = () => setIsMobile(mq.matches);

        update();

        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

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
            requestAnimationFrame(() => setActiveTab(tab));
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
        return () => window.removeEventListener('keydown', keydownHandler);
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

    // --------------------------------------------
    // CONTROLLABLE CHART/TABLE SPLIT (persisted)
    // --------------------------------------------
    // These control alignment with right column wallet:
    const TABLE_DEFAULT = 195; // should match .wallet max-height in CSS
    const TABLE_MIN = 195;
    const CHART_MIN = 200;

    const TABLE_COLLAPSED = 38; // table height when collapsed (a small bar)
    const TABLE_COLLAPSE_TRIGGER = 160; // when table gets smaller than this, snap down

    const leftColRef = useRef<HTMLDivElement | null>(null);
    const tableSectionRef = useRef<HTMLElement | null>(null);
    const HEADER_HIT_HEIGHT = 10;

    // local state used while dragging for immediate feedback
    const [chartTopHeight, setChartTopHeightLocal] = useState<number>(
        storedHeight ?? 570,
    );
    const startHeightRef = useRef(chartTopHeight);
    // Using a large but finite number instead of Infinity for CSS compatibility
    const [maxTop, setMaxTop] = useState<number>(10000);
    const userRatioRef = useRef<number | null>(null);
    const hasUserOverrideRef = useRef<boolean>(false);

    const chartTopHeightRef = useRef<number>(chartTopHeight);
    useEffect(() => {
        chartTopHeightRef.current = chartTopHeight;
    }, [chartTopHeight]);

    const setHeightBoth = (h: number) => {
        setChartTopHeightLocal(h);
        setChartTopHeight(h);
        if (typeof plausible === 'function') {
            const newTradeTableHeightAsPercentageOfWindowHeight =
                ((window.innerHeight - h) / window.innerHeight) * 100;
            plausible('Trade Table Resize', {
                props: {
                    tradeTablePercentOfWindowHeight: getSizePercentageSegment(
                        newTradeTableHeightAsPercentageOfWindowHeight,
                    ),
                },
            });
        }
    };

    const getGap = () => {
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue('--gap-s')
            .trim();
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : 8;
    };
    // calculates available height in left column
    const getAvailable = () => {
        const col = leftColRef.current;
        if (!col) return null;
        const gap = getGap();
        const total = col.clientHeight;
        return Math.max(0, total - gap);
    };

    // Compute default from layout
    const setDefaultFromLayout = useCallback(() => {
        const col = leftColRef.current;
        if (!col) return;

        const gap = getGap();
        const total = col.clientHeight;

        // Keep table at TABLE_DEFAULT px in default mode
        const top = Math.max(CHART_MIN, total - TABLE_DEFAULT - gap);

        // LOCAL update only
        setChartTopHeightLocal(top);

        const max = Math.max(CHART_MIN, total - TABLE_COLLAPSED - gap);
        setMaxTop(max);
    }, [setChartTopHeightLocal]);

    // On mount / when store changes:
    // This effect sets up the chart/table split whenever the component mounts or when storedHeight changes. If there’s no saved height, it falls back to the default layout. If there is one, it restores the user’s preferred height (clamped if needed) and remembers their ratio.
    useEffect(() => {
        const col = leftColRef.current;
        if (!col) return;

        const gap = getGap();
        const total = col.clientHeight;
        const available = Math.max(0, total - gap);
        const max = Math.max(CHART_MIN, total - TABLE_COLLAPSED - gap);
        setMaxTop(max);

        if (storedHeight == null) {
            // DEFAULT MODE: no user override, no persistence, no ratio
            hasUserOverrideRef.current = false;
            userRatioRef.current = null;
            requestAnimationFrame(setDefaultFromLayout);
        } else {
            const clamped = Math.min(Math.max(storedHeight, CHART_MIN), max);
            setChartTopHeightLocal(clamped);
            if (clamped !== storedHeight) setChartTopHeight(clamped);

            hasUserOverrideRef.current = true;
            userRatioRef.current = available > 0 ? clamped / available : null;
        }
    }, [storedHeight, setDefaultFromLayout, setChartTopHeight]);

    // Recompute (or clamp) when the left column resizes
    // Recompute (or clamp) only when HEIGHT changes
    // Recompute (or clamp) when the left column (re)mounts or resizes.
    // We rebind when mobile/desktop toggles so we never hold a stale node.
    useEffect(() => {
        let raf = 0;

        const apply = () => {
            const col = leftColRef.current;
            if (!col) return;

            const gap = getGap();
            const total = col.clientHeight;
            const available = Math.max(0, total - gap);
            const max = Math.max(CHART_MIN, total - TABLE_COLLAPSED - gap);
            setMaxTop(max);

            if (
                hasUserOverrideRef.current &&
                userRatioRef.current != null &&
                available > 0
            ) {
                const desired = userRatioRef.current * available;
                const next = Math.max(CHART_MIN, Math.min(desired, max));
                if (Math.abs(next - (chartTopHeightRef.current ?? 0)) > 0.5) {
                    setChartTopHeightLocal(next);
                    chartTopHeightRef.current = next;
                }
            } else {
                const topByDefault = Math.max(
                    CHART_MIN,
                    total - TABLE_DEFAULT - gap,
                );
                const next = Math.min(topByDefault, max);
                if (Math.abs(next - (chartTopHeightRef.current ?? 0)) > 0.5) {
                    setChartTopHeightLocal(next);
                    chartTopHeightRef.current = next;
                }
            }
        };

        const schedule = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(apply);
        };

        const ro = new ResizeObserver(schedule);
        const el = leftColRef.current;
        if (el) ro.observe(el);

        window.addEventListener('resize', schedule, { passive: true });

        // run once after (re)binding
        schedule();

        return () => {
            if (raf) cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('resize', schedule);
        };
    }, [isMobile]); // <— rebind when going in/out of mobile

    //  listen for global reset event
    useEffect(() => {
        const handler = () => {
            resetLayoutHeights(); // clears store
            hasUserOverrideRef.current = false;
            userRatioRef.current = null;
            requestAnimationFrame(setDefaultFromLayout);
        };
        window.addEventListener('trade:resetLayout', handler as EventListener);
        return () =>
            window.removeEventListener(
                'trade:resetLayout',
                handler as EventListener,
            );
    }, [resetLayoutHeights, setDefaultFromLayout]);

    const clamp = (n: number) => Math.max(CHART_MIN, Math.min(n, maxTop));

    const tabList = useMemo(
        () =>
            [
                { key: 'order', label: t('navigation.trade') },
                { key: 'chart', label: t('navigation.chart') },
                { key: 'book', label: t('orderBook.book') },
                { key: 'recent', label: t('navigation.recent') },
                { key: 'positions', label: t('navigation.positions') },
            ] as const,
        [t],
    );

    const handleTabClick = useCallback(
        (tab: TabType) => () => switchTab(tab),
        [switchTab],
    );
    useEffect(() => {
        if (activeTab !== 'positions' && positionsMenuOpen) {
            setPositionsMenuOpen(false);
        }
    }, [activeTab, positionsMenuOpen]);

    const [isTablet, setIsTablet] = useState(false);

    useLayoutEffect(() => {
        const mqTablet = window.matchMedia(
            '(min-width: 768px) and (max-width: 1080px)',
        );
        const updateTablet = () => setIsTablet(mqTablet.matches);
        updateTablet();
        mqTablet.addEventListener('change', updateTablet);
        return () => mqTablet.removeEventListener('change', updateTablet);
    }, []);

    const MobileTabNavigation = useMemo(() => {
        return (
            <div className={styles.mobileTabNav} id='mobileTradeTabs'>
                <div className={styles.mobileTabBtns}>
                    {tabList.map(({ key, label }) => {
                        if (key !== 'positions') {
                            return (
                                <button
                                    key={key}
                                    className={`${styles.mobileTabBtn} ${activeTab === key ? styles.active : ''}`}
                                    onClick={handleTabClick(key)}
                                >
                                    {label}
                                </button>
                            );
                        }

                        // POSITIONS becomes dropdown
                        return (
                            <div
                                key='positions'
                                ref={posWrapRef}
                                className={styles.posTabWrap}
                            >
                                <button
                                    aria-haspopup='listbox'
                                    aria-expanded={positionsMenuOpen}
                                    className={`${styles.mobileTabBtn} ${activeTab === 'positions' ? styles.active : ''} ${styles.posTabBtn}`}
                                    onClick={() => {
                                        if (activeTab !== 'positions')
                                            switchTab('positions');
                                        setPositionsMenuOpen((v) => !v);
                                    }}
                                >
                                    {currentMobileLabel}
                                    <svg
                                        className={styles.posCaret}
                                        width='14'
                                        height='14'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            d='M7 10l5 5 5-5'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                    </svg>
                                </button>

                                {positionsMenuOpen && (
                                    <div
                                        role='listbox'
                                        className={styles.posMenu}
                                    >
                                        {MOBILE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                role='option'
                                                aria-selected={
                                                    selectedTradeTab === opt
                                                }
                                                className={`${styles.posItem} ${selectedTradeTab === opt ? styles.activeItem : ''}`}
                                                onClick={() => {
                                                    setSelectedTradeTab(opt);
                                                    setPositionsMenuOpen(false);
                                                    if (
                                                        activeTab !==
                                                        'positions'
                                                    )
                                                        switchTab('positions');
                                                }}
                                            >
                                                {MOBILE_VIEW_LABELS[opt]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }, [
        activeTab,
        handleTabClick,
        tabList,
        positionsMenuOpen,
        selectedTradeTab,
        currentMobileLabel,
        switchTab,
        setSelectedTradeTab,
    ]);

    const mobileOrderBookView = useMemo(
        () => (
            <div className={styles.mobileOnlyOrderBook}>
                {(activeTab === 'book' || visibilityRefs.current.book) && (
                    <MemoizedOrderBookSection
                        mobileView
                        mobileContent='orderBook'
                        chartTopHeight={chartTopHeight}
                        switchTab={switchTab}
                    />
                )}
            </div>
        ),
        [symbol, activeTab, switchTab],
    );

    const mobileRecentTradesView = useMemo(
        () => (
            <div className={styles.mobileOnlyRecentTrades}>
                {(activeTab === 'recent' || visibilityRefs.current.recent) && (
                    <MemoizedOrderBookSection
                        mobileView
                        mobileContent='recentTrades'
                        chartTopHeight={chartTopHeight}
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

    const isTableCollapsed = () => {
        const available = getAvailable();
        if (!available || available <= 0) return false;
        const currentTop = chartTopHeightRef.current ?? chartTopHeight;
        const tableHeight = available - currentTop;
        return tableHeight <= TABLE_COLLAPSED + 0.5;
    };

    const openTableToDefault = () => {
        const available = getAvailable();
        if (!available || available <= 0) return;
        const desiredTable = Math.max(TABLE_MIN, TABLE_DEFAULT);
        const targetTop = clamp(available - desiredTable);
        hasUserOverrideRef.current = true;
        userRatioRef.current = targetTop / available;
        setHeightBoth(targetTop);
        if (typeof plausible === 'function') {
            plausible('Trade Table Resize', {
                props: {
                    tradeTablePercentOfWindowHeight: 'default',
                },
            });
        }
    };

    const collapseTableToBar = () => {
        const available = getAvailable();
        if (!available || available <= 0) return;
        const snapTo = clamp(available - TABLE_COLLAPSED);
        hasUserOverrideRef.current = true;
        userRatioRef.current = snapTo / available;
        setHeightBoth(snapTo);
        if (typeof plausible === 'function') {
            plausible('Trade Table Resize', {
                props: {
                    tradeTablePercentOfWindowHeight: 'minimum',
                },
            });
        }
    };

    const isInteractiveEl = (el: HTMLElement | null) =>
        !!el?.closest(
            'button, [role="tab"], [data-tab], [data-action], a, input, select, textarea, [contenteditable="true"], [data-ensure-open]',
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
                    {/* Sticky dropdown header inside the scrollable section */}
                    {/* <div className={styles.mobilePositionsSwitcher}>
                        <button
                            type='button'
                            aria-haspopup='listbox'
                            aria-expanded={mobilePortfolioMenuOpen}
                            className={styles.mobilePositionsSwitcherBtn}
                            onClick={() =>
                                setMobilePortfolioMenuOpen((v) => !v)
                            }
                        >
                            <span
                                className={styles.mobilePositionsSwitcherDot}
                                aria-hidden
                            />
                            {currentMobileLabel}
                            <svg
                                className={styles.mobilePositionsSwitcherChev}
                                width='14'
                                height='14'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    d='M7 10l5 5 5-5'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                />
                            </svg>
                        </button>

                        {mobilePortfolioMenuOpen && (
                            <div
                                role='listbox'
                                className={styles.mobilePositionsSwitcherMenu}
                            >
                                {MOBILE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        role='option'
                                        aria-selected={selectedTradeTab === opt}
                                        className={`${styles.mobilePositionsSwitcherItem} ${selectedTradeTab === opt ? styles.active : ''}`}
                                        onClick={() => {
                                            setSelectedTradeTab(opt); // 👈 drive the same store TradeTable uses
                                            setMobilePortfolioMenuOpen(false);
                                        }}
                                    >
                                        {MOBILE_VIEW_LABELS[opt]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div> */}

                    {/* Hide TradeTable's own tabs & allow ANY subtable on mobile */}
                    {(activeTab === 'positions' ||
                        visibilityRefs.current.positions) && (
                        <MemoizedTradeTable mobileExternalSwitcher />
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
                <div className={styles.containerNew} id='tradePageRoot'>
                    {/* LEFT COLUMN */}
                    <div
                        className={styles.leftCol}
                        ref={leftColRef}
                        key={isMobile ? 'm' : 'd'}
                    >
                        <Resizable
                            size={{ width: '100%', height: chartTopHeight }}
                            minHeight={CHART_MIN}
                            maxHeight={maxTop}
                            enable={{ bottom: true }}
                            handleStyles={{
                                bottom: { height: '8px', cursor: 'row-resize' },
                            }}
                            onResizeStart={() => {
                                startHeightRef.current = chartTopHeight;
                            }}
                            onResize={(e, dir, ref, d: NumberSize) => {
                                const tentative = clamp(
                                    startHeightRef.current + d.height,
                                );
                                setChartTopHeightLocal(tentative);

                                const available = getAvailable();
                                if (available && available > 0) {
                                    userRatioRef.current =
                                        tentative / available;
                                }
                            }}
                            onResizeStop={(e, dir, ref, d: NumberSize) => {
                                const next = clamp(
                                    startHeightRef.current + d.height,
                                );
                                hasUserOverrideRef.current = true;

                                const available = getAvailable(); // total height available for chart + table
                                if (!available || available <= 0) {
                                    setHeightBoth(next);
                                    return;
                                }

                                const tableHeight = available - next;
                                const startHeight =
                                    available - startHeightRef.current;

                                if (
                                    tableHeight <= TABLE_COLLAPSE_TRIGGER &&
                                    (!(startHeight <= TABLE_COLLAPSED) ||
                                        tableHeight === TABLE_COLLAPSED)
                                ) {
                                    // SNAP DOWN: collapse the table to a thin bar
                                    const snapTo = available - TABLE_COLLAPSED;
                                    setHeightBoth(snapTo);
                                    userRatioRef.current = snapTo / available;
                                } else if (tableHeight < TABLE_MIN) {
                                    // too small but not past the collapse trigger → snap back up to min
                                    const snapTo = available - TABLE_MIN;
                                    setHeightBoth(snapTo);
                                    userRatioRef.current = snapTo / available;
                                } else {
                                    // normal persisted height
                                    setHeightBoth(next);
                                    userRatioRef.current = next / available;
                                }
                            }}
                        >
                            {/* TOP: chart + orderbook. Force 100% to fill Resizable */}
                            <section
                                className={`${styles.containerTop} ${orderBookMode === 'large' ? styles.orderBookLarge : ''}`}
                                style={{ height: '100%' }}
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
                                        <div
                                            id='chartSection'
                                            className={styles.chart}
                                        >
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
                                            <LiquidationsChartSection
                                                symbol={symbol}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                                <div
                                    id='orderBookSection'
                                    className={styles.orderBook}
                                >
                                    {isTablet ? (
                                        <ExpandableOrderBook
                                            // collapsed={30}
                                            expanded={400}
                                        >
                                            <MemoizedOrderBookSection
                                                chartTopHeight={chartTopHeight}
                                            />
                                        </ExpandableOrderBook>
                                    ) : (
                                        <MemoizedOrderBookSection
                                            chartTopHeight={chartTopHeight}
                                        />
                                    )}
                                </div>
                            </section>
                        </Resizable>

                        {/* BOTTOM: table auto-fills leftover space */}
                        <section
                            className={styles.table}
                            id='tutorial-trade-table'
                            ref={tableSectionRef}
                            onClick={(e) => {
                                const el = e.target as HTMLElement | null;
                                if (!el) return;

                                const isInteractive = isInteractiveEl(el);

                                if (isInteractive && isTableCollapsed()) {
                                    // defer opening until after the child click finishes
                                    requestAnimationFrame(() => {
                                        openTableToDefault();
                                    });
                                }
                            }}
                            onDoubleClick={(e) => {
                                if (isMobile) return;

                                const target = e.target as HTMLElement | null;
                                if (!target) return;

                                // Never react to generic interactives anywhere in the section
                                if (isInteractiveEl(target)) return;

                                // Find the tabs header (<Tabs ... data-tabs>)
                                const headerEl =
                                    tableSectionRef.current?.querySelector(
                                        '[data-tabs]',
                                    ) as HTMLElement | null;
                                if (!headerEl) return;

                                // Is the dblclick point inside the header rect?
                                const r = headerEl.getBoundingClientRect();
                                const insideHeader =
                                    e.clientY >= r.top &&
                                    e.clientY <= r.bottom &&
                                    e.clientX >= r.left &&
                                    e.clientX <= r.right;

                                if (!insideHeader) return;

                                // Block only direct interactives in the header: tab buttons, right actions, and arrows.
                                if (
                                    target.closest(
                                        'button, [role="tab"], [data-tabs-right], [data-tabs-arrow]',
                                    )
                                ) {
                                    return;
                                }

                                // Toggle: collapsed → open; otherwise collapse
                                if (isTableCollapsed()) {
                                    openTableToDefault();
                                } else {
                                    collapseTableToBar();
                                }
                            }}
                        >
                            <MemoizedTradeTable />
                        </section>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className={styles.rightCol}>
                        <section className={styles.order_input}>
                            <OrderInput
                                marginBucket={marginBucket}
                                isAnyPortfolioModalOpen={
                                    isAnyPortfolioModalOpen
                                }
                            />
                        </section>
                        <section className={styles.wallet}>
                            <DepositDropdown
                                marginBucket={marginBucket}
                                openDepositModal={openDepositModal}
                                openWithdrawModal={openWithdrawModal}
                            />
                        </section>
                    </div>
                    {PortfolioModalsRenderer}
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
