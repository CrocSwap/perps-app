import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import Modal from '~/components/Modal/Modal';
import PerformancePanel from '~/components/Portfolio/PerformancePanel/PerformancePanel';
import { useModal } from '~/hooks/useModal';
import { feeSchedules, type feeTierIF } from '~/utils/feeSchedule';
import WebDataConsumer from '../trade/webdataconsumer';
import styles from './portfolio.module.css';
import { usePortfolioManager } from './usePortfolioManager';
import { usePortfolioModals } from './usePortfolioModals';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import useNumFormatter from '~/hooks/useNumFormatter';
import Tooltip from '~/components/Tooltip/Tooltip';
import {
    IoArrowUp,
    IoArrowDown,
    IoChevronForward,
    IoChevronBack,
} from 'react-icons/io5';
import PortfolioTables from '~/components/Portfolio/PortfolioTable/PortfolioTable';
import AnimatedBackground from '~/components/AnimatedBackground/AnimatedBackground';
import { Resizable, type NumberSize } from 're-resizable';
import { useAppSettings } from '~/stores/AppSettingsStore';

const MemoizedPerformancePanel = memo(PerformancePanel);

export function meta() {
    return [
        { title: 'Portfolio | Ambient Finance' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

function Portfolio() {
    const mainRef = useRef<HTMLDivElement | null>(null);

    const DEFAULT_PANEL_HEIGHT = 480;
    const PANEL_MIN = 180;
    const TABLE_MIN = 250;

    const { portfolioPanelHeight, setPortfolioPanelHeight } = useAppSettings();

    // Hydration state
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const persist = (useAppSettings as any).persist;
        if (!persist) {
            setIsHydrated(true);
            return;
        }

        if (persist.hasHydrated?.()) {
            setIsHydrated(true);
            return;
        }

        const unsub = persist.onFinishHydration?.(() => {
            setIsHydrated(true);
        });

        return unsub;
    }, []);

    const [panelHeight, setPanelHeight] = useState<number>(
        portfolioPanelHeight ?? DEFAULT_PANEL_HEIGHT,
    );
    const [maxTop, setMaxTop] = useState<number | null>(null);
    const startRef = useRef(panelHeight);
    const hasInitialized = useRef(false);

    useLayoutEffect(() => {
        if (!isHydrated || hasInitialized.current) return;
        const el = mainRef.current;
        if (!el) return;
        const gap =
            parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue(
                    '--gap-s',
                ),
            ) || 8;
        const total = el.clientHeight;
        const computed = Math.max(PANEL_MIN, total - TABLE_MIN - gap);
        setMaxTop(computed);

        hasInitialized.current = true;
        const storeValue = portfolioPanelHeight ?? DEFAULT_PANEL_HEIGHT;
        const clamped = Math.max(PANEL_MIN, Math.min(storeValue, computed));
        setPanelHeight(clamped);
        setIsLayoutReady(true);
    }, [isHydrated, portfolioPanelHeight]);

    useEffect(() => {
        if (maxTop === null || !hasInitialized.current) return;
        setPanelHeight((prev) => {
            const next = Math.max(PANEL_MIN, Math.min(prev, maxTop));
            return next === prev ? prev : next;
        });
    }, [maxTop]);

    const { portfolio, formatCurrency, userData } = usePortfolioManager();
    const { formatNum } = useNumFormatter();
    const location = useLocation();

    // Check if we're on the transactions sub-route (mobile only)
    const isTransactionsView = location.pathname.includes('/transactions');

    const {
        openDepositModal,
        openWithdrawModal,
        openSendModal,
        PortfolioModalsRenderer,
    } = usePortfolioModals();

    const feeScheduleModalCtrl = useModal('closed');

    // Extract user stats from leaderboard data (same as PerformancePanel)
    const userStats = userData?.data?.leaderboard?.[0];

    // Format stats the same way as PerformancePanel
    const pnlFormatted = userStats?.pnl
        ? formatNum(userStats.pnl, 2, true, true)
        : '$0.00';
    const volumeFormatted = userStats?.volume
        ? formatNum(userStats.volume, 2, true, true)
        : '$0.00';
    const maxDrawdownFormatted = userStats?.maxDrawdown
        ? formatNum(userStats.maxDrawdown, 2)
        : '0.00%';
    const totalEquityFormatted = userStats?.account_value
        ? formatNum(userStats.account_value, 2, true, true)
        : '$0.00';
    const accountEquityFormatted = userStats?.account_value
        ? formatNum(userStats.account_value, 2, true, true)
        : '$0.00';
    const vaultEquityFormatted = userStats?.vaultEquity
        ? formatNum(userStats.vaultEquity)
        : '$0.00';

    // Calculate PNL percentage for display
    const totalValue = portfolio.balances.contract + portfolio.balances.wallet;
    const pnlValue = userStats?.pnl ?? 0;
    const pnlPercent = totalValue > 0 ? (pnlValue / totalValue) * 100 : 0;
    const isPnlPositive = pnlValue >= 0;

    if (!isHydrated) {
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOBILE TOP - HERO CARD ONLY
    // ═══════════════════════════════════════════════════════════════════════
    const mobileTop = (
        <section className={styles.mobileTop}>
            {/* Hero Card - Net Value */}
            <div className={styles.mobileHeroCard}>
                <div className={styles.heroLabel}>Total Net Value</div>
                <div className={styles.heroValue}>
                    {formatCurrency(totalValue)}
                </div>
                <div
                    className={`${styles.heroPnl} ${isPnlPositive ? styles.positive : styles.negative}`}
                >
                    <span className={styles.heroPnlIcon}>
                        {isPnlPositive ? <IoArrowUp /> : <IoArrowDown />}
                    </span>
                    {formatCurrency(Math.abs(pnlValue))} (
                    {isPnlPositive ? '+' : ''}
                    {pnlPercent.toFixed(2)}%)
                </div>

                {/* Balance breakdown inside hero */}
                <div className={styles.heroBalances}>
                    <div className={styles.heroBalanceItem}>
                        <span className={styles.heroBalanceLabel}>
                            Contract
                        </span>
                        <span className={styles.heroBalanceValue}>
                            {formatCurrency(portfolio.balances.contract)}
                        </span>
                    </div>
                    <div className={styles.heroBalanceDivider} />
                    <div className={styles.heroBalanceItem}>
                        <span className={styles.heroBalanceLabel}>Wallet</span>
                        <span className={styles.heroBalanceValue}>
                            {formatCurrency(portfolio.balances.wallet)}
                        </span>
                    </div>
                    <div className={styles.heroBalanceDivider} />
                    <div className={styles.heroBalanceItem}>
                        <span className={styles.heroBalanceLabel}>Fees</span>
                        <span className={styles.heroBalanceValue}>0.00%</span>
                    </div>
                </div>
            </div>
        </section>
    );

    // ═══════════════════════════════════════════════════════════════════════
    // MOBILE STATS - Rendered at bottom
    // ═══════════════════════════════════════════════════════════════════════
    const mobileStatsSection = (
        <div className={styles.mobileStats}>
            <div className={styles.mobileStatRow}>
                <span className={styles.mobileStatLabel}>PNL</span>
                <span
                    className={`${styles.mobileStatValue} ${pnlValue >= 0 ? styles.positive : styles.negative}`}
                >
                    {pnlFormatted}
                </span>
            </div>
            <div className={styles.mobileStatRow}>
                <span className={styles.mobileStatLabel}>Volume</span>
                <span className={styles.mobileStatValue}>
                    {volumeFormatted}
                </span>
            </div>
            <div className={styles.mobileStatRow}>
                <span className={styles.mobileStatLabel}>Max Drawdown</span>
                <span className={styles.mobileStatValue}>
                    {maxDrawdownFormatted}
                </span>
            </div>
            <div className={styles.mobileStatRow}>
                <span className={styles.mobileStatLabel}>Total Equity</span>
                <span className={styles.mobileStatValue}>
                    {totalEquityFormatted}
                </span>
            </div>
            <div className={styles.mobileStatRow}>
                <span className={styles.mobileStatLabel}>Account Equity</span>
                <span className={styles.mobileStatValue}>
                    {accountEquityFormatted}
                </span>
            </div>
            <div className={styles.mobileStatRow}>
                <span className={styles.mobileStatLabel}>Vault Equity</span>
                <span className={styles.mobileStatValue}>
                    {vaultEquityFormatted}
                </span>
            </div>
        </div>
    );

    return (
        <div
            className={styles.outer}
            style={{ opacity: isLayoutReady ? 1 : 0 }}
        >
            <div className={styles.container}>
                <AnimatedBackground
                    mode='absolute'
                    layers={1}
                    opacity={1}
                    duration='15s'
                    strokeWidth='2'
                    palette={{
                        color1: '#1E1E24',
                        color2: '#7371FC',
                        color3: '#CDC1FF',
                    }}
                />
                <WebDataConsumer />

                {/* Header - changes on mobile transactions view */}
                {isTransactionsView ? (
                    <header className={styles.mobileTransactionsHeader}>
                        <Link to='/v2/portfolio' className={styles.backLink}>
                            <IoChevronBack />
                            <span className={styles.breadcrumb}>
                                <span className={styles.breadcrumbParent}>
                                    Portfolio
                                </span>
                                <span className={styles.breadcrumbSeparator}>
                                    &gt;
                                </span>
                                <span className={styles.breadcrumbCurrent}>
                                    Transactions
                                </span>
                            </span>
                        </Link>
                    </header>
                ) : (
                    <header>Portfolio</header>
                )}

                <div className={styles.column}>
                    {/* Mobile Hero Section */}
                    {mobileTop}

                    {/* Desktop Details Container */}
                    <div className={styles.detailsContainer}>
                        <div className={styles.detailsContent}>
                            <h6>Fees</h6>
                            <Tooltip content='Maker fees 0.1%' position='top'>
                                <h3>Always 0.00%</h3>
                            </Tooltip>
                            <div
                                className={styles.view_detail_clickable}
                                style={{ visibility: 'hidden' }}
                                onClick={() => feeScheduleModalCtrl.open()}
                            >
                                View fee schedule
                            </div>
                        </div>

                        <div
                            className={`${styles.detailsContent} ${styles.netValueMobile}`}
                        >
                            <h6>Total Net USD Value</h6>
                            <h3>{formatCurrency(totalValue)}</h3>
                        </div>

                        <div className={styles.totalNetDisplay}>
                            <h6>
                                <span>Total Net USD Value:</span>{' '}
                                {formatCurrency(totalValue)}
                            </h6>
                            <div className={styles.buttonContainer}>
                                <div className={styles.rowButton}>
                                    <SimpleButton
                                        onClick={openDepositModal}
                                        bg='accent1'
                                    >
                                        Deposit
                                    </SimpleButton>
                                    <SimpleButton
                                        onClick={openWithdrawModal}
                                        bg='dark3'
                                        hoverBg='accent1'
                                    >
                                        Withdraw
                                    </SimpleButton>
                                    <SimpleButton
                                        onClick={openSendModal}
                                        className={styles.sendMobile}
                                        bg='dark3'
                                        hoverBg='accent1'
                                    >
                                        Send
                                    </SimpleButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    <section
                        id={'portfolioTablesMainContent'}
                        className={styles.mainContent}
                        ref={mainRef}
                    >
                        {/* Desktop: Resizable split view */}
                        <div className={styles.desktopView}>
                            <Resizable
                                size={{ width: '100%', height: panelHeight }}
                                minHeight={PANEL_MIN}
                                maxHeight={maxTop ?? undefined}
                                enable={{ bottom: true }}
                                handleStyles={{
                                    bottom: {
                                        height: '8px',
                                        cursor: 'row-resize',
                                    },
                                }}
                                handleComponent={{
                                    bottom: (
                                        <div className={styles.resizeHandle}>
                                            <div
                                                className={styles.resizeGrip}
                                            />
                                        </div>
                                    ),
                                }}
                                onResizeStart={() => {
                                    startRef.current = panelHeight;
                                }}
                                onResize={(_e, _dir, _ref, d: NumberSize) => {
                                    const next = Math.max(
                                        PANEL_MIN,
                                        Math.min(
                                            startRef.current + d.height,
                                            maxTop ?? 10000,
                                        ),
                                    );
                                    setPanelHeight(next);
                                }}
                                onResizeStop={() => {
                                    setPortfolioPanelHeight(panelHeight);
                                }}
                            >
                                <section
                                    style={{
                                        height: '100%',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {isLayoutReady && (
                                        <MemoizedPerformancePanel
                                            userData={userData}
                                            panelHeight={panelHeight}
                                            isMobile={false}
                                        />
                                    )}
                                </section>
                            </Resizable>

                            <section className={styles.table}>
                                <PortfolioTables />
                            </section>
                        </div>

                        {/* Mobile: Conditional content based on route */}
                        <div className={styles.mobileViewContainer}>
                            {isTransactionsView ? (
                                /* Transactions View - All stacked tables */
                                <section
                                    className={styles.mobileTransactionsContent}
                                >
                                    <PortfolioTables
                                        layout='stacked'
                                        visibleSections={[
                                            'common.positions',
                                            'common.openOrders',
                                            'common.balances',
                                            'common.tradeHistory',
                                            'common.orderHistory',
                                            'common.depositsAndWithdrawals',
                                        ]}
                                        stackedTableHeight={250}
                                    />
                                </section>
                            ) : (
                                /* Default Portfolio View */
                                <>
                                    <section
                                        style={{
                                            height: '100%',
                                            overflow: 'visible',
                                        }}
                                    >
                                        {isLayoutReady && (
                                            <MemoizedPerformancePanel
                                                userData={userData}
                                                panelHeight={panelHeight}
                                                isMobile={true}
                                            />
                                        )}
                                    </section>
                                    {/* Mobile Stats */}
                                    {mobileStatsSection}
                                    {/* Mobile Action Buttons */}
                                    <div className={styles.mobileActions}>
                                        <button
                                            className={`${styles.mobileActionBtn} ${styles.primary}`}
                                            onClick={openDepositModal}
                                        >
                                            Deposit
                                        </button>
                                        <button
                                            className={`${styles.mobileActionBtn} ${styles.secondary}`}
                                            onClick={openWithdrawModal}
                                        >
                                            Withdraw
                                        </button>
                                    </div>

                                    {/* Stacked Tables - right under performance */}
                                    <section
                                        className={styles.mobileStackedTables}
                                    >
                                        <PortfolioTables
                                            layout='stacked'
                                            visibleSections={[
                                                'common.positions',
                                                'common.openOrders',
                                                'common.balances',
                                            ]}
                                            stackedTableHeight={180}
                                        />
                                    </section>

                                    {/* View All History - right under tables */}
                                    <Link
                                        to='/v2/portfolio/transactions'
                                        className={styles.viewAllHistoryLink}
                                    >
                                        <span>View All History</span>
                                        <IoChevronForward />
                                    </Link>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {PortfolioModalsRenderer}

            {feeScheduleModalCtrl.isOpen && (
                <Modal
                    close={feeScheduleModalCtrl.close}
                    title={'Fee Schedule'}
                >
                    <div className={styles.fee_schedule_modal}>
                        <section className={styles.fee_table}>
                            <h4>VIP Tiers</h4>
                            <header>
                                <div>Tier</div>
                                <div>14D Volume</div>
                                <div>Taker</div>
                                <div>Maker</div>
                            </header>
                            <ol>
                                {feeSchedules.vip.map((feeTier: feeTierIF) => (
                                    <li key={JSON.stringify(feeTier)}>
                                        <div>{feeTier.tier}</div>
                                        <div>{feeTier.volume14d}</div>
                                        <div>{feeTier.taker}</div>
                                        <div>{feeTier.maker}</div>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className={styles.fee_table}>
                            <h4>Market Maker Tiers</h4>
                            <header>
                                <div>Tier</div>
                                <div>14D Volume</div>
                                <div />
                                <div>Maker</div>
                            </header>
                            <ol>
                                {feeSchedules.marketMaker.map(
                                    (feeTier: feeTierIF) => (
                                        <li key={JSON.stringify(feeTier)}>
                                            <div>{feeTier.tier}</div>
                                            <div>{feeTier.volume14d}</div>
                                            <div>{feeTier.taker}</div>
                                            <div>{feeTier.maker}</div>
                                        </li>
                                    ),
                                )}
                            </ol>
                        </section>

                        <div className={styles.neg_fees}>
                            Negative fees are rebates
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default memo(Portfolio);
