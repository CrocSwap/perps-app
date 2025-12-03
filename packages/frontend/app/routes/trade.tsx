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
import SymbolInfoMobile from './trade/symbol/symbolInfoMobile';
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
import useOutsideClick from '~/hooks/useOutsideClick';
import ExpandableOrderBook from './trade/orderbook/ExpandableOrderBook';
import { HiOutlineChevronDoubleDown } from 'react-icons/hi2';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import useMediaQuery from '~/hooks/useMediaQuery';

const MemoizedTradeTable = memo(TradeTable);
const MemoizedTradingViewWrapper = memo(TradingViewWrapper);
const MemoizedOrderBookSection = memo(OrderBookSection);
const MemoizedSymbolInfo = memo(SymbolInfo);
const MemoizedSymbolInfoMobile = memo(SymbolInfoMobile);

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
    // --- HYDRATION GATE (add after your other useState hooks) ---
    const [settingsHydrated, setSettingsHydrated] = useState(() => {
        const p = (useAppSettings as any).persist;
        return p?.hasHydrated?.() ?? false;
    });

    useEffect(() => {
        const p = (useAppSettings as any).persist;
        if (!p) {
            setSettingsHydrated(true);
            return;
        }

        // If already hydrated (e.g., navigated within SPA)
        if (p.hasHydrated?.()) {
            setSettingsHydrated(true);
            return;
        }

        // Wait until persist finishes hydration
        const unsub = p.onFinishHydration?.(() => setSettingsHydrated(true));
        return () => {
            unsub && unsub();
        };
    }, []);
    // --- end HYDRATION GATE ---

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

    const sessionState = useSession();
    const isUserConnected = isEstablished(sessionState);
    const { marginBucket } = useUnifiedMarginData();
    const { t } = useTranslation();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;

    const setHeightLocalOnly = (h: number) => {
        setChartTopHeightLocal(h);
        chartTopHeightRef.current = h;
    };
    const didInitRef = useRef(false);

    const {
        orderBookMode,
        chartTopHeight: storedHeight,
        setChartTopHeight,
        resetLayoutHeights,
        isWalletCollapsed,
        setIsWalletCollapsed,
    } = useAppSettings();

    const { marketId } = useParams<{ marketId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('order');
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const useSymbolInfoMobile = useMediaQuery('(max-width: 480px)');

    const { debugToolbarOpen, setDebugToolbarOpen } = useAppStateStore();
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

    // local state used while dragging for immediate feedback
    const [chartTopHeight, setChartTopHeightLocal] = useState<number>(
        storedHeight ?? 570,
    );
    const startHeightRef = useRef(chartTopHeight);
    const [maxTop, setMaxTop] = useState<number>(10000);
    const userRatioRef = useRef<number | null>(null);
    const hasUserOverrideRef = useRef<boolean>(false);

    const chartTopHeightRef = useRef<number>(chartTopHeight);
    const wasDraggingRef = useRef(false);
    const wasDraggingRightRef = useRef(false);

    const orderInputStartHeightRef = useRef<number>(450);
    const orderInputHeightRef = useRef<number>(450);
    const rightColRef = useRef<HTMLDivElement | null>(null);
    const isWalletCollapsedRef = useRef(isWalletCollapsed);
    useEffect(() => {
        isWalletCollapsedRef.current = isWalletCollapsed;
    }, [isWalletCollapsed]);

    // Constants for order input resize
    const ORDER_INPUT_DEFAULT = 450;
    const ORDER_INPUT_MIN = 300;
    const WALLET_MIN = 30;
    const WALLET_DEFAULT = 195;
    const WALLET_COLLAPSED = 40; // Just shows header
    const WALLET_COLLAPSE_THRESHOLD = 50; // When wallet gets below this, snap to collapsed
    const WALLET_MAX = 187; // Maximum height for wallet section
    const WALLET_EXPAND_HYSTERESIS = 20;
    const [orderInputHeight, setOrderInputHeight] =
        useState<number>(ORDER_INPUT_DEFAULT);

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

    const getRightColAvailable = () => {
        const col = rightColRef.current;
        if (!col) return null;
        const gap = getGap();
        const total = col.clientHeight;
        return Math.max(0, total - gap);
    };
    const getMaxOrderInputHeight = () => {
        const available = getRightColAvailable();
        if (!available || available <= 0) return ORDER_INPUT_DEFAULT;
        const minWalletHeight = isWalletCollapsed
            ? WALLET_COLLAPSED
            : WALLET_MIN;
        return Math.max(
            ORDER_INPUT_MIN,
            available - minWalletHeight - getGap(),
        );
    };
    const getMinOrderInputHeight = () => {
        const available = getRightColAvailable();
        if (!available || available <= 0) return ORDER_INPUT_MIN;
        // Minimum order input = total - max wallet - gap
        // This prevents wallet from expanding beyond WALLET_MAX
        return Math.max(ORDER_INPUT_MIN, available - WALLET_MAX - getGap());
    };

    const clampOrderInputHeight = (h: number) => {
        const max = getMaxOrderInputHeight();
        const min = getMinOrderInputHeight();
        return Math.max(min, Math.min(h, max));
    };
    const setOrderInputHeightBoth = (h: number) => {
        const clamped = clampOrderInputHeight(h);
        setOrderInputHeight(clamped);
        orderInputHeightRef.current = clamped;
    };
    const expandWalletToDefault = () => {
        const available = getRightColAvailable();
        if (!available || available <= 0) return;

        const targetOrderInputHeight = Math.max(
            ORDER_INPUT_MIN,
            available - WALLET_DEFAULT - getGap(),
        );

        setIsWalletCollapsed(false);
        setOrderInputHeightBoth(targetOrderInputHeight);
    };

    const collapseWallet = () => {
        const available = getRightColAvailable();
        if (!available || available <= 0) return;

        const targetOrderInputHeight = Math.max(
            ORDER_INPUT_MIN,
            available - WALLET_COLLAPSED - getGap(),
        );

        setIsWalletCollapsed(true);
        setOrderInputHeightBoth(targetOrderInputHeight);
    };
    // Initialize order input height based on layout
    useLayoutEffect(() => {
        const col = rightColRef.current;
        if (!col) return;

        const gap = getGap();
        const total = col.clientHeight;
        const available = Math.max(0, total - gap);

        // Calculate initial height based on whether wallet is collapsed
        const initialWalletHeight = isWalletCollapsed
            ? WALLET_COLLAPSED
            : WALLET_DEFAULT;

        const initial = Math.max(
            ORDER_INPUT_MIN,
            available - initialWalletHeight - gap,
        );

        setOrderInputHeight(initial);
        orderInputHeightRef.current = initial;
    }, []);

    // Recalculate when wallet collapsed state changes (important for initial load from storage)
    useEffect(() => {
        const col = rightColRef.current;
        if (!col) return;

        const gap = getGap();
        const total = col.clientHeight;
        const available = Math.max(0, total - gap);

        const targetWalletHeight = isWalletCollapsed
            ? WALLET_COLLAPSED
            : WALLET_DEFAULT;

        const targetOrderInputHeight = Math.max(
            ORDER_INPUT_MIN,
            available - targetWalletHeight - gap,
        );

        // Only update if there's a significant difference
        if (Math.abs(targetOrderInputHeight - orderInputHeight) > 5) {
            setOrderInputHeightBoth(targetOrderInputHeight);
        }
    }, [isWalletCollapsed]);

    // MOST IMPORTANT EFFECT IN HANDLING TRADE LAYOUT
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
            if (isUserConnected) {
                // Connected + no saved preference → open to default table height (195px)
                const desiredTable = Math.max(TABLE_MIN, TABLE_DEFAULT); // 195
                const targetTop = Math.min(
                    Math.max(CHART_MIN, available - desiredTable),
                    max,
                );
                // set default height as preference in local storage so we initialize with it and not session
                setHeightLocalOnly(targetTop);
                setChartTopHeight(targetTop);

                // remember ratio so future resizes keep intent
                hasUserOverrideRef.current = true;
                userRatioRef.current =
                    available > 0 ? targetTop / available : null;
            } else {
                //  Not connected + no saved preference → keep your current collapsed behavior
                const snapTo = Math.min(
                    Math.max(CHART_MIN, available - TABLE_COLLAPSED),
                    max,
                );
                setHeightLocalOnly(snapTo);

                hasUserOverrideRef.current = true;
                userRatioRef.current =
                    available > 0 ? snapTo / available : null;
            }
        } else {
            // Return user to their saved preference (collapsed or not)
            const clamped = Math.min(Math.max(storedHeight, CHART_MIN), max);
            setChartTopHeightLocal(clamped);
            if (clamped !== storedHeight) setChartTopHeight(clamped);
            hasUserOverrideRef.current = true;
            userRatioRef.current = available > 0 ? clamped / available : null;
        }

        didInitRef.current = true;
    }, [storedHeight, setChartTopHeight, isUserConnected]);

    // Recompute (or clamp) when the left column resizes
    useEffect(() => {
        let raf = 0;

        const apply = () => {
            if (!didInitRef.current) return;

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

    // Early return while settings are hydrating to avoid first-paint jump
    if (!settingsHydrated)
        return <div style={{ height: '100%', minHeight: '100%' }} />;

    // Mobile view
    if (isMobile && symbol) {
        return (
            <motion.div
                key='trade-hydrated-mobile'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
            >
                <TradeRouteHandler />
                <WebDataConsumer />
                <div className={styles.symbolInfoContainer}>
                    {useSymbolInfoMobile ? (
                        <MemoizedSymbolInfoMobile />
                    ) : (
                        <MemoizedSymbolInfo />
                    )}
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
                    {/* Hide TradeTable's own tabs & allow ANY subtable on mobile */}
                    {(activeTab === 'positions' ||
                        visibilityRefs.current.positions) && (
                        <MemoizedTradeTable mobileExternalSwitcher />
                    )}
                </div>
            </motion.div>
        );
    }
    return (
        <>
            <TradeRouteHandler />
            <WebDataConsumer />
            {symbol && (
                <motion.div
                    key='trade-hydrated'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className={styles.containerNew}
                    id='tradePageRoot'
                >
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
                                wasDraggingRef.current = false;
                            }}
                            onResize={(e, dir, ref, d: NumberSize) => {
                                const tentative = clamp(
                                    startHeightRef.current + d.height,
                                );
                                setChartTopHeightLocal(tentative);
                                // mark as dragging after a tiny threshold to filter out clicks
                                if (Math.abs(d.height) >= 2)
                                    wasDraggingRef.current = true;

                                const available = getAvailable();
                                if (available && available > 0) {
                                    userRatioRef.current =
                                        tentative / available;
                                }
                            }}
                            onResizeStop={(e, dir, ref, d: NumberSize) => {
                                if (
                                    !wasDraggingRef.current ||
                                    Math.abs(d.height) < 2
                                )
                                    return;

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
                    <div className={styles.rightCol} ref={rightColRef}>
                        <Resizable
                            size={{
                                width: '100%',
                                height: orderInputHeight ?? ORDER_INPUT_DEFAULT,
                            }}
                            minHeight={getMinOrderInputHeight()}
                            maxHeight={getMaxOrderInputHeight()}
                            enable={{ bottom: true }}
                            handleStyles={{
                                bottom: {
                                    height: '8px',
                                    cursor: 'row-resize',
                                    background: 'transparent',
                                    zIndex: 10,
                                },
                            }}
                            onResizeStart={() => {
                                orderInputStartHeightRef.current =
                                    orderInputHeight;
                                wasDraggingRightRef.current = false;
                            }}
                            onResize={(e, dir, ref, d: NumberSize) => {
                                const tentative =
                                    orderInputStartHeightRef.current + d.height;
                                const clamped =
                                    clampOrderInputHeight(tentative);

                                // live height update while dragging
                                setOrderInputHeight(clamped);
                                if (Math.abs(d.height) >= 2)
                                    wasDraggingRightRef.current = true;

                                const available = getRightColAvailable();
                                if (available && available > 0) {
                                    const walletHeight =
                                        available - clamped - getGap();

                                    // collapse immediately when below threshold
                                    if (
                                        walletHeight <=
                                            WALLET_COLLAPSE_THRESHOLD &&
                                        !isWalletCollapsedRef.current
                                    ) {
                                        isWalletCollapsedRef.current = true;
                                        setIsWalletCollapsed(true);
                                    }

                                    // re-expand only after we're clearly above collapsed height
                                    if (
                                        walletHeight >=
                                            WALLET_COLLAPSED +
                                                WALLET_EXPAND_HYSTERESIS &&
                                        isWalletCollapsedRef.current
                                    ) {
                                        isWalletCollapsedRef.current = false;
                                        setIsWalletCollapsed(false);
                                    }
                                }
                            }}
                            onResizeStop={(e, dir, ref, d: NumberSize) => {
                                // ⛔️ ignore click / micro move
                                if (
                                    !wasDraggingRightRef.current ||
                                    Math.abs(d.height) < 2
                                )
                                    return;
                                const next =
                                    orderInputStartHeightRef.current + d.height;
                                const available = getRightColAvailable();

                                if (!available || available <= 0) {
                                    setOrderInputHeightBoth(next);
                                    return;
                                }

                                const walletHeight =
                                    available - next - getGap();

                                // Check if we should snap to collapsed
                                if (
                                    walletHeight <= WALLET_COLLAPSE_THRESHOLD &&
                                    !isWalletCollapsed
                                ) {
                                    collapseWallet();
                                }
                                // Check if we should expand from collapsed
                                else if (
                                    walletHeight > WALLET_COLLAPSED + 20 &&
                                    isWalletCollapsed
                                ) {
                                    setIsWalletCollapsed(false);
                                    setOrderInputHeightBoth(next);
                                }
                                // Normal resize
                                else {
                                    setOrderInputHeightBoth(next);
                                }
                            }}
                        >
                            <section
                                className={styles.order_input}
                                style={{ height: '100%' }}
                            >
                                <OrderInput
                                    marginBucket={marginBucket}
                                    isAnyPortfolioModalOpen={
                                        isAnyPortfolioModalOpen
                                    }
                                />
                            </section>
                        </Resizable>

                        <section
                            className={`${styles.wallet} ${isWalletCollapsed ? styles.walletCollapsed : ''}`}
                            onClick={(e) => {
                                if (isWalletCollapsed) {
                                    e.stopPropagation();
                                    expandWalletToDefault();
                                }
                            }}
                        >
                            {isWalletCollapsed ? (
                                <div className={styles.walletCollapsedHeader}>
                                    <span>Account Overview</span>
                                </div>
                            ) : (
                                <DepositDropdown
                                    marginBucket={marginBucket}
                                    openDepositModal={openDepositModal}
                                    openWithdrawModal={openWithdrawModal}
                                />
                            )}
                        </section>
                        {/* Toggle under the wallet (inline like OrderDetails) */}
                        <motion.button
                            type='button'
                            className={styles.scroll_button}
                            onClick={() => {
                                if (isWalletCollapsed) {
                                    expandWalletToDefault();
                                } else {
                                    collapseWallet();
                                }
                            }}
                            aria-label={
                                isWalletCollapsed
                                    ? t?.(
                                          'portfolio.expandWallet',
                                          'Expand wallet',
                                      )
                                    : t?.(
                                          'portfolio.collapseWallet',
                                          'Collapse wallet',
                                      )
                            }
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.div
                                animate={{
                                    rotate: isWalletCollapsed ? 180 : 0,
                                }}
                                transition={{
                                    duration: 0.2,
                                    ease: [0.4, 0.0, 0.2, 1],
                                }}
                            >
                                {!isWalletCollapsed && isUserConnected && (
                                    <HiOutlineChevronDoubleDown
                                        className={styles.scroll_icon}
                                    />
                                )}
                            </motion.div>
                        </motion.button>
                    </div>
                    {PortfolioModalsRenderer}
                </motion.div>
            )}
            <AdvancedTutorialController
                isEnabled={showTutorial}
                onComplete={handleTutorialComplete}
                onSkip={handleTutorialSkip}
            />
        </>
    );
}
