import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import PerformancePanel from '~/components/Portfolio/PerformancePanel/PerformancePanel';
import { useModal } from '~/hooks/useModal';
import { feeSchedules, type feeTierIF } from '~/utils/feeSchedule';
import WebDataConsumer from '../trade/webdataconsumer';
import styles from './portfolio.module.css';
import { usePortfolioManager } from './usePortfolioManager';
import { usePortfolioModals } from './usePortfolioModals';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import useOutsideClick from '~/hooks/useOutsideClick';
import useNumFormatter from '~/hooks/useNumFormatter';
import Tooltip from '~/components/Tooltip/Tooltip';
import {
    PiCaretCircleDoubleDownLight,
    PiCaretCircleDoubleUpLight,
} from 'react-icons/pi';
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

    // Don't render until we've read from localStorage
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const persist = (useAppSettings as any).persist;
        if (!persist) {
            setIsHydrated(true);
            return;
        }

        // If already hydrated
        if (persist.hasHydrated?.()) {
            setIsHydrated(true);
            return;
        }

        // Wait for hydration
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

    // Compute maxTop so the table never shrinks below TABLE_MIN
    useLayoutEffect(() => {
        if (!isHydrated || hasInitialized.current) return; // Wait for hydration first, only run once
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

        // Set initial height from store, clamped to bounds
        hasInitialized.current = true;
        const storeValue = portfolioPanelHeight ?? DEFAULT_PANEL_HEIGHT;
        const clamped = Math.max(PANEL_MIN, Math.min(storeValue, computed));
        setPanelHeight(clamped);
        setIsLayoutReady(true);
    }, [isHydrated, portfolioPanelHeight]);

    // WHEN LAYOUT CHANGES (maxTop on window resize), clamp LOCAL state to respect bounds
    useEffect(() => {
        if (maxTop === null || !hasInitialized.current) return;
        setPanelHeight((prev) => {
            const next = Math.max(PANEL_MIN, Math.min(prev, maxTop));
            return next === prev ? prev : next;
        });
    }, [maxTop]);

    const { portfolio, formatCurrency, userData } = usePortfolioManager();
    const [isMobileActionMenuOpen, setIsMobileActionMenuOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'performance' | 'table'>(
        'performance',
    );
    const { currency } = useNumFormatter();

    const {
        openDepositModal,
        openWithdrawModal,
        openSendModal,
        PortfolioModalsRenderer,
    } = usePortfolioModals();

    const feeScheduleModalCtrl = useModal('closed');
    const mobileActionMenuButtonRef = useRef<HTMLButtonElement>(null);
    const mobileActionMenuRef = useOutsideClick<HTMLDivElement>((event) => {
        const target = event.target as HTMLElement;
        if (mobileActionMenuButtonRef.current?.contains(target)) return;
        setIsMobileActionMenuOpen(false);
    }, isMobileActionMenuOpen);

    // Don't render anything until store has hydrated
    if (!isHydrated) {
        return null;
    }

    const mobileTop = (
        <section className={styles.mobileTop}>
            <div className={styles.detailsContent}>
                <h6>Vol(14d)</h6>
                <h3>{currency(portfolio.tradingVolume.biWeekly, true)}</h3>
                <div
                    className={styles.view_detail_clickable}
                    onClick={() => console.log('viewing volume')}
                >
                    View volume
                </div>
            </div>
            <div className={styles.detailsContent}>
                <h6>Fees (Taker / Maker)</h6>
                <h3>
                    {portfolio.fees.taker}% / {portfolio.fees.maker}%
                </h3>
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
                <h6>Total USD Val</h6>
                <h3>
                    {currency(
                        portfolio.balances.contract + portfolio.balances.wallet,
                        true,
                    )}
                </h3>
            </div>
            <button
                ref={mobileActionMenuButtonRef}
                onClick={() => setIsMobileActionMenuOpen((v) => !v)}
                className={styles.actionMenuButton}
            >
                {!isMobileActionMenuOpen ? (
                    <PiCaretCircleDoubleDownLight size={24} />
                ) : (
                    <PiCaretCircleDoubleUpLight size={24} />
                )}
            </button>
            {isMobileActionMenuOpen && (
                <div
                    className={styles.mobileActionMenuContainer}
                    ref={mobileActionMenuRef}
                >
                    <SimpleButton onClick={openDepositModal} bg='accent1'>
                        Deposit
                    </SimpleButton>
                    <SimpleButton
                        onClick={openWithdrawModal}
                        bg='dark3'
                        hoverBg='accent1'
                    >
                        Withdraw
                    </SimpleButton>
                </div>
            )}
        </section>
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
                <header>Portfolio</header>

                <div className={styles.column}>
                    {mobileTop}

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
                            <h3>
                                {formatCurrency(
                                    portfolio.balances.contract +
                                        portfolio.balances.wallet,
                                )}
                            </h3>
                        </div>

                        <div className={styles.totalNetDisplay}>
                            <h6>
                                <span>Total Net USD Value:</span>{' '}
                                {formatCurrency(
                                    portfolio.balances.contract +
                                        portfolio.balances.wallet,
                                )}
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

                    {/* Mobile toggle buttons */}
                    <div className={styles.mobileToggle}>
                        <button
                            className={`${styles.toggleButton} ${mobileView === 'performance' ? styles.active : ''}`}
                            onClick={() => setMobileView('performance')}
                        >
                            Performance
                        </button>
                        <button
                            className={`${styles.toggleButton} ${mobileView === 'table' ? styles.active : ''}`}
                            onClick={() => setMobileView('table')}
                        >
                            Positions
                        </button>
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
                                    // Persist only on user action
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

                        {/* Mobile: Toggle between views */}
                        <div className={styles.mobileViewContainer}>
                            {mobileView === 'performance' ? (
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
                            ) : (
                                <section className={styles.table}>
                                    <PortfolioTables />
                                </section>
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
