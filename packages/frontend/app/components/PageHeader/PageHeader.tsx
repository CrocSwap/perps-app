import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useEffect, useRef, useState } from 'react';
import { Fuul } from '@fuul/sdk';
import { useFuul } from '~/contexts/FuulContext';
// import { AiOutlineQuestionCircle } from 'react-icons/ai';
// import {
//     DFLT_EMBER_MARKET,
//     getUserMarginBucket,
//     USD_MINT,
// } from '@crocswap-libs/ambient-ember';
import { LuChevronDown, LuChevronUp, LuSettings } from 'react-icons/lu';
import { MdOutlineClose, MdOutlineMoreHoriz } from 'react-icons/md';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router';
import { useKeydown } from '~/hooks/useKeydown';
import useMediaQuery, { useShortScreen } from '~/hooks/useMediaQuery';
import { useModal } from '~/hooks/useModal';
import useOutsideClick from '~/hooks/useOutsideClick';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { usePortfolioModals } from '~/routes/portfolio/usePortfolioModals';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import AppOptions from '../AppOptions/AppOptions';
import Modal from '../Modal/Modal';
import Tooltip from '../Tooltip/Tooltip';
import DropdownMenu from './DropdownMenu/DropdownMenu';
// import HelpDropdown from './HelpDropdown/HelpDropdown';
import MoreDropdown from './MoreDropdown/MoreDropdown';
import styles from './PageHeader.module.css';
import RpcDropdown from './RpcDropdown/RpcDropdown';
// import WalletDropdown from './WalletDropdown/WalletDropdown';
import { getDurationSegment } from '~/utils/functions/getSegment';
import DepositDropdown from './DepositDropdown/DepositDropdown';
import { useUserDataStore } from '~/stores/UserDataStore';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import {
    URL_PARAMS,
    useUrlParams,
    type UrlParamMethodsIF,
} from '~/hooks/useURLParams';
import { useReferralStore } from '~/stores/ReferralStore';
import { useTranslation } from 'react-i18next';
import { getAmbientSpotUrl } from '~/utils/ambientSpotUrls';
import AnnouncementBannerHost from '../AnnouncementBanner/AnnouncementBannerHost';
import { ACTIVE_ANNOUNCEMENT_BANNER } from '~/utils/Constants';
import { useKeyboardShortcuts } from '~/contexts/KeyboardShortcutsContext';
import { useNotificationStore } from '~/stores/NotificationStore';
import {
    getKeyboardShortcutById,
    getKeyboardShortcutCategories,
    matchesShortcutEvent,
} from '~/utils/keyboardShortcuts';
import { useAppSettings } from '~/stores/AppSettingsStore';

export default function PageHeader() {
    // Feedback modal state
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    // run the FUUL context
    const { trackPageView } = useFuul();

    const handleFeedbackClose = () => {
        setIsFeedbackOpen(false);
    };

    const referralCodeFromURL: UrlParamMethodsIF = useUrlParams(
        URL_PARAMS.referralCode,
    );

    const userDataStore = useUserDataStore();

    const referralStore = useReferralStore();
    const { t } = useTranslation();

    const sessionState = useSession();

    const isUserConnected = isEstablished(sessionState);

    // Fetch user's total volume for FUUL tracking
    useEffect(() => {
        const affiliateAddress = userDataStore.userAddress;
        if (!affiliateAddress) {
            return;
        }

        (async () => {
            try {
                const EMBER_ENDPOINT_ALL =
                    'https://ember-leaderboard.liquidity.tools/leaderboard';
                const emberEndpointForUser =
                    EMBER_ENDPOINT_ALL + '/' + affiliateAddress.toString();

                const response = await fetch(emberEndpointForUser);
                const data = await response.json();

                if (data.error) {
                    referralStore.setTotVolume(0);
                } else if (data.leaderboard && data.leaderboard.length > 0) {
                    const volume = data.leaderboard[0].volume;
                    referralStore.setTotVolume(volume);
                }
            } catch (error) {
                referralStore.setTotVolume(NaN);
            }
        })();
    }, [userDataStore.userAddress]);

    const { isInitialized: isFuulInitialized } = useFuul();

    const sessionButtonRef = useRef<HTMLSpanElement>(null);
    const { notifications, latestTx } = useNotificationStore();
    const { navigationKeyboardShortcutsEnabled } = useAppSettings();

    useEffect(() => {
        const button = sessionButtonRef.current;
        if (button) {
            const handleClick = () => {
                if (!isUserConnected) {
                    localStorage.setItem(
                        'loginButtonClickTime',
                        Date.now().toString(),
                    );
                }
            };

            button.addEventListener('click', handleClick);
            return () => button.removeEventListener('click', handleClick);
        }
    }, [isUserConnected]);

    // state values to track whether a given menu is open
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);
    // const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
    // const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
    const showRPCButton = false;
    const location = useLocation();

    // symbol for active market
    const { symbol } = useTradeDataStore();

    // Use unified margin data
    const { marginBucket } = useUnifiedMarginData();

    const landingTime = useRef<number>(Date.now());

    // data to generate nav links in page header
    const navLinks = [
        { name: t('navigation.trade'), path: `/v2/trade/${symbol}` },
        // { name: 'Vaults', path: '/v2/vaults' },
        // { name: 'Portfolio', path: '/v2/portfolio' },
        // { name: 'Referrals', path: '/v2/referrals' },
        // { name: 'Points', path: '/points' },
        // { name: 'Leaderboard', path: '/v2/leaderboard' },
        // { name: 'Strategies', path: '/strategies' },
        // { name: 'Docs', path: '/docs' },
    ];

    // refs for dropdown menu handline
    const dropdownMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsDropdownMenuOpen(false);
    }, isDropdownMenuOpen);
    const mobileNavbarRef = useOutsideClick<HTMLDivElement>(() => {
        setIsMenuOpen(false);
    }, isMenuOpen);
    // const walletMenuRef = useOutsideClick<HTMLDivElement>(() => {
    //     setIsWalletMenuOpen(false);
    // }, isWalletMenuOpen);
    const rpcMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsRpcDropdownOpen(false);
    }, isRpcDropdownOpen);
    const depositMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsDepositDropdownOpen(false);
    }, isDepositDropdownOpen);

    const moreDropdownRef = useOutsideClick<HTMLDivElement>(() => {
        setIsMoreDropdownOpen(false);
    }, isMoreDropdownOpen);

    // const helpDropdownRef = useOutsideClick<HTMLDivElement>(() => {
    //     setIsHelpDropdownOpen(false);
    // }, isHelpDropdownOpen);

    // logic to open and close modals
    const appSettingsModal = useModal('closed');
    const openAppSettingsModalRef = useRef(appSettingsModal.open);
    openAppSettingsModalRef.current = appSettingsModal.open;

    // event handler to close dropdown menus on `Escape` keydown
    useKeydown(
        'Escape',
        () => {
            setIsDepositDropdownOpen(false);
            setIsRpcDropdownOpen(false);
            // setIsWalletMenuOpen(false);
            // setIsHelpDropdownOpen(false);
            setIsMoreDropdownOpen(false);
            setIsDropdownMenuOpen(false);
        },
        [],
    );

    const shortA = useShortScreen();
    const shortB = useMediaQuery('(max-width: 600px)');
    const isShortScreen: boolean = shortA || shortB;

    const {
        openDepositModal,
        openWithdrawModal,
        PortfolioModalsRenderer,
        isAnyPortfolioModalOpen,
    } = usePortfolioModals();

    const { isOpen: isKeyboardShortcutsOpen } = useKeyboardShortcuts();

    useEffect(() => {
        if (isKeyboardShortcutsOpen || isAnyPortfolioModalOpen) return;

        const clickSessionButton = () => {
            const wrapper = sessionButtonRef.current;
            const el = wrapper?.querySelector(
                'button, [role="button"]',
            ) as HTMLElement | null;
            el?.click();
        };

        const shouldIgnoreDueToTyping = (target: HTMLElement | null) => {
            if (!target) return false;

            const isOptedInField = !!target.closest?.(
                '[data-allow-keyboard-shortcuts="true"]',
            );
            if (isOptedInField) return false;

            if (target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true;
            }

            if (target.tagName === 'INPUT') {
                const input = target as HTMLInputElement;
                const isNumericInput = input.inputMode === 'numeric';
                if (!isNumericInput) {
                    return true;
                }
            }

            return false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (shouldIgnoreDueToTyping(target)) return;

            if (
                e.altKey &&
                !e.shiftKey &&
                !e.ctrlKey &&
                !e.metaKey &&
                e.code === 'Comma'
            ) {
                e.preventDefault();
                openAppSettingsModalRef.current();
                return;
            }

            const categories = getKeyboardShortcutCategories(t);
            const connectWalletShortcut = getKeyboardShortcutById(
                categories,
                'wallet.connect',
            );
            const depositShortcut = getKeyboardShortcutById(
                categories,
                'portfolio.deposit',
            );
            const withdrawShortcut = getKeyboardShortcutById(
                categories,
                'portfolio.withdraw',
            );
            const latestTxShortcut = getKeyboardShortcutById(
                categories,
                'portfolio.latestTx',
            );

            const isRelevantShortcut =
                (!!connectWalletShortcut &&
                    matchesShortcutEvent(e, connectWalletShortcut.keys)) ||
                (!!depositShortcut &&
                    matchesShortcutEvent(e, depositShortcut.keys)) ||
                (!!withdrawShortcut &&
                    matchesShortcutEvent(e, withdrawShortcut.keys)) ||
                (!!latestTxShortcut &&
                    matchesShortcutEvent(e, latestTxShortcut.keys));

            if (!isRelevantShortcut) return;

            if (!navigationKeyboardShortcutsEnabled) return;

            if (
                connectWalletShortcut &&
                matchesShortcutEvent(e, connectWalletShortcut.keys)
            ) {
                e.preventDefault();
                clickSessionButton();
                return;
            }

            if (
                latestTxShortcut &&
                matchesShortcutEvent(e, latestTxShortcut.keys)
            ) {
                e.preventDefault();
                const latest = latestTx;
                if (latest?.txLink) {
                    window.open(latest.txLink, '_blank', 'noopener,noreferrer');
                }
                return;
            }

            if (
                depositShortcut &&
                matchesShortcutEvent(e, depositShortcut.keys)
            ) {
                e.preventDefault();
                openDepositModal();
                return;
            }

            if (
                withdrawShortcut &&
                matchesShortcutEvent(e, withdrawShortcut.keys)
            ) {
                e.preventDefault();
                openWithdrawModal();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [
        isAnyPortfolioModalOpen,
        isKeyboardShortcutsOpen,
        openDepositModal,
        openWithdrawModal,
        latestTx,
        t,
    ]);

    // Holds previous user connection status
    const prevIsUserConnected = useRef(isUserConnected);

    useEffect(() => {
        if (prevIsUserConnected.current === false && isUserConnected === true) {
            if (typeof plausible === 'function') {
                const loginButtonClickTime = Number(
                    localStorage.getItem('loginButtonClickTime'),
                );
                plausible('Session Established', {
                    props: {
                        loginTime: loginButtonClickTime
                            ? getDurationSegment(
                                  loginButtonClickTime,
                                  Date.now(),
                              )
                            : 'no login button clicked',
                        loginRefreshTime: !loginButtonClickTime
                            ? getDurationSegment(
                                  landingTime.current,
                                  Date.now(),
                              )
                            : 'login button clicked',
                    },
                });
            }
            localStorage.removeItem('loginButtonClickTime');
        } else if (
            prevIsUserConnected.current === true &&
            isUserConnected === false
        ) {
            if (typeof plausible === 'function') {
                plausible('Session Ended');
            }
        }

        prevIsUserConnected.current = isUserConnected;
    }, [isUserConnected, userDataStore.userAddress]);

    const { totVolume } = useReferralStore();

    // track page views with Fuul
    useEffect(() => {
        if (
            isFuulInitialized &&
            totVolume !== undefined &&
            !Number.isNaN(totVolume) &&
            // totVolume < 10000 &&
            userDataStore.userAddress
        ) {
            console.log('sending pageview for: ', location.pathname);
            trackPageView();
        } else {
            localStorage.removeItem('fuul.sent_pageview');
        }
    }, [location, isFuulInitialized, totVolume, userDataStore.userAddress]);

    const showDepositSlot = isUserConnected || !isShortScreen;
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/';

    const handleLogoClick = () => {
        if (isHomePage) {
            // Scroll to hero section if already on homepage
            const snapContainer = document.querySelector(
                '[class*="snapContainer"]',
            ) as HTMLElement;
            if (snapContainer) {
                const heroSection = snapContainer.querySelector(
                    '[data-preset="hero"]',
                ) as HTMLElement;
                if (heroSection) {
                    heroSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } else {
            // Navigate to homepage if not already there
            navigate('/');
        }
    };

    const invalidRefCodeModal = useModal('closed');

    // run the FUUL context
    const { isAffiliateCodeFree } = useFuul();

    useEffect(() => {
        const checkRefCode = async (): Promise<void> => {
            if (referralCodeFromURL.value) {
                const isCodeClaimed: boolean = await isAffiliateCodeFree(
                    referralCodeFromURL.value,
                );
                isCodeClaimed
                    ? referralStore.cache(referralCodeFromURL.value)
                    : invalidRefCodeModal.open();
            }
        };
        checkRefCode();
    }, [referralCodeFromURL.value, isAffiliateCodeFree]);

    return (
        <>
            <header id={'pageHeader'} className={styles.container}>
                <button
                    onClick={handleLogoClick}
                    className={styles.logo}
                    aria-label='Go to home'
                >
                    <img
                        src='/images/favicon.svg'
                        alt='Perps Logo'
                        width='70px'
                        height='70px'
                        loading='eager'
                    />
                </button>
                <nav
                    className={`${styles.nav} ${
                        isMenuOpen ? styles.showMenu : ''
                    }`}
                    ref={isMenuOpen ? mobileNavbarRef : null}
                >
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className={styles.mobileNavCloseButton}
                        aria-label={t('aria.closeNav')}
                    >
                        <MdOutlineClose size={20} color='var(--text1)' />
                    </button>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={
                                location.pathname.includes(link.path)
                                    ? styles.activeNavLink
                                    : styles.navLink
                            }
                            onClick={() => {
                                if (isMenuOpen) setIsMenuOpen(false);
                            }}
                            viewTransition
                        >
                            {link.name}
                        </Link>
                    ))}
                    <section
                        style={{
                            position: 'relative',
                        }}
                        className={styles.moreSection}
                        ref={moreDropdownRef}
                    >
                        <button
                            className={styles.moreButton}
                            onClick={() =>
                                setIsMoreDropdownOpen(!isMoreDropdownOpen)
                            }
                        >
                            More
                            {isMoreDropdownOpen ? (
                                <LuChevronUp size={15} />
                            ) : (
                                <LuChevronDown size={15} />
                            )}
                        </button>
                        {isMoreDropdownOpen && (
                            <MoreDropdown
                                setIsMoreDropdownOpen={setIsMoreDropdownOpen}
                            />
                        )}
                    </section>
                    <Tooltip content='Ambient v1 Spot DEX' position='bottom'>
                        <a
                            href={getAmbientSpotUrl(symbol)}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={styles.ambientmm}
                        >
                            Spot
                        </a>
                    </Tooltip>
                    <AnnouncementBannerHost
                        type={ACTIVE_ANNOUNCEMENT_BANNER}
                        dismissible={false}
                        inPageHeader
                    />
                </nav>

                <div className={styles.rightSide}>
                    {showDepositSlot && (
                        <span className={styles.depositSlot}>
                            {isUserConnected ? (
                                <section
                                    style={{ position: 'relative' }}
                                    ref={depositMenuRef}
                                >
                                    <button
                                        className={styles.depositButton}
                                        onClick={() => {
                                            if (isShortScreen) {
                                                setIsDepositDropdownOpen(
                                                    !isDepositDropdownOpen,
                                                );
                                            } else {
                                                openDepositModal();
                                            }
                                        }}
                                    >
                                        {isShortScreen
                                            ? t('common.transfer')
                                            : t('common.deposit')}
                                    </button>

                                    {isDepositDropdownOpen && (
                                        <DepositDropdown
                                            isDropdown
                                            marginBucket={marginBucket}
                                            openDepositModal={openDepositModal}
                                            openWithdrawModal={
                                                openWithdrawModal
                                            }
                                        />
                                    )}
                                </section>
                            ) : (
                                // desktop/tablet placeholder only (prevents layout shift on connect)
                                <div
                                    // className={styles.depositButtonPlaceholder}
                                    aria-hidden
                                />
                            )}
                        </span>
                    )}

                    {isUserConnected && showRPCButton && (
                        <section
                            style={{ position: 'relative' }}
                            ref={rpcMenuRef}
                        >
                            {isUserConnected && (
                                <button
                                    className={styles.rpcButton}
                                    onClick={() =>
                                        setIsRpcDropdownOpen(!isRpcDropdownOpen)
                                    }
                                >
                                    <span>RPC</span>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                    >
                                        <circle
                                            cx='8'
                                            cy='8'
                                            r='8'
                                            fill='#26A69A'
                                        />
                                    </svg>
                                </button>
                            )}

                            {isRpcDropdownOpen && isUserConnected && (
                                <RpcDropdown />
                            )}
                        </section>
                    )}
                    <span
                        ref={sessionButtonRef}
                        className={`${styles.sessionWrap} ${isUserConnected ? styles.activeSessionWrap : ''}`}
                        data-plausible-event-name={
                            !isUserConnected ? 'Login Button Click' : undefined
                        }
                        data-plausible-event-buttonlocation={
                            !isUserConnected ? 'Page Header' : undefined
                        }
                    >
                        <SessionButton compact={shortB} />
                    </span>

                    {/* {isUserConnected && (
                        <section
                            style={{ position: 'relative' }}
                            ref={walletMenuRef}
                        >
                            {isUserConnected && (
                                <button
                                    className={styles.walletButton}
                                    onClick={() =>
                                        setIsWalletMenuOpen(!isWalletMenuOpen)
                                    }
                                >
                                    <LuWallet size={18} /> Miyuki.eth
                                </button>
                            )}

                            {isWalletMenuOpen && isUserConnected && (
                                <WalletDropdown
                                    isWalletMenuOpen={isWalletMenuOpen}
                                    setIsWalletMenuOpen={setIsWalletMenuOpen}
                                    setIsUserConnected={setIsUserConnected}
                                    isDropdown
                                />
                            )}
                        </section>
                    )} */}
                    {/* <section
                        style={{
                            position: 'relative',
                        }}
                        ref={helpDropdownRef}
                    >
                        <button
                            className={styles.helpButton}
                            onClick={() =>
                                setIsHelpDropdownOpen(!isHelpDropdownOpen)
                            }
                        >
                            <LuCircleHelp
                                size={18}
                                color='var(--text2)'
                            />
                        </button>

                        {isHelpDropdownOpen && (
                            <HelpDropdown
                                setIsHelpDropdownOpen={setIsHelpDropdownOpen}
                            />
                        )}
                    </section> */}

                    <button
                        className={styles.internationalButton}
                        onClick={() => appSettingsModal.open()}
                        aria-label={t('aria.openSettings')}
                    >
                        <LuSettings size={20} />
                    </button>
                    <section
                        style={{ position: 'relative' }}
                        ref={dropdownMenuRef}
                        className={styles.menuButtonContainer}
                    >
                        <button
                            className={styles.menuButton}
                            onClick={() =>
                                setIsDropdownMenuOpen(!isDropdownMenuOpen)
                            }
                            aria-label={t('aria.openMoreOptionsMenu')}
                        >
                            <MdOutlineMoreHoriz size={20} />
                        </button>
                        {isDropdownMenuOpen && (
                            <DropdownMenu
                                setIsDropdownMenuOpen={setIsDropdownMenuOpen}
                                onFeedbackClick={() => setIsFeedbackOpen(true)}
                            />
                        )}
                    </section>
                </div>
            </header>

            {appSettingsModal.isOpen && (
                <Modal
                    close={() => appSettingsModal.close()}
                    position={'center'}
                    title={t('appSettings.title')}
                >
                    <AppOptions closePanel={() => appSettingsModal.close()} />
                </Modal>
            )}
            {invalidRefCodeModal.isOpen && (
                <Modal
                    close={invalidRefCodeModal.close}
                    position='center'
                    title='Unknown Referral Code'
                >
                    <div className={styles.invalid_ref_code_modal}>
                        <p>
                            The referral code you entered is not recognized.
                            Please check the code and try again.
                        </p>
                        <Link
                            to='/v2/referrals'
                            onClick={invalidRefCodeModal.close}
                        >
                            Go to Referrals
                        </Link>
                    </div>
                </Modal>
            )}
            {PortfolioModalsRenderer}
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={handleFeedbackClose}
            />
        </>
    );
}
