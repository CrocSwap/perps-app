import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useEffect, useRef, useState } from 'react';
// import { AiOutlineQuestionCircle } from 'react-icons/ai';
// import {
//     DFLT_EMBER_MARKET,
//     getUserMarginBucket,
//     USD_MINT,
// } from '@crocswap-libs/ambient-ember';
import { LuChevronDown, LuChevronUp, LuSettings } from 'react-icons/lu';
import { MdOutlineClose, MdOutlineMoreHoriz } from 'react-icons/md';
import { Link, useLocation } from 'react-router';
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
import HelpDropdown from './HelpDropdown/HelpDropdown';
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
import ReferralCodeModal from './ReferralCodeModal/ReferralCodeModal';
import { useReferralStore, type RefCodeIF } from '~/stores/ReferralStore';
import { useTranslation } from 'react-i18next';

export default function PageHeader() {
    // Feedback modal state
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const handleFeedbackClose = () => {
        setIsFeedbackOpen(false);
    };

    const referralCodeFromURL: UrlParamMethodsIF = useUrlParams(
        URL_PARAMS.referralCode,
    );

    // logic to read a URL referral code and set in state + local storage
    const userDataStore = useUserDataStore();
    // ref to ensure that the intialization only happens once
    // const isRefCodeInitialized = useRef<boolean>(!!userDataStore.refCode.value);
    // initialize ref code if relevant
    // if (!isRefCodeInitialized.current) {
    //     isRefCodeInitialized.current = true;
    //     referralCodeFromURL.value &&
    //         userDataStore.initializeRefCode(referralCodeFromURL.value);
    // }
    // useEffect(() => {
    //     if (referralCodeURL.value) {
    //         userDataStore.setReferralCode(referralCodeURL.value);
    //         // const newSearchParams = new URLSearchParams(
    //         //     searchParams.toString(),
    //         // );
    //         // newSearchParams.delete(REFERRAL_CODE_URL_PARAM);
    //         // const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
    //         // window.history.replaceState({}, '', newUrl); // remove referral code from URL
    //     }
    // }, [referralCodeURL.value]);

    const referralStore = useReferralStore();
    const { t } = useTranslation();

    const sessionState = useSession();

    const isUserConnected = isEstablished(sessionState);

    const sessionButtonRef = useRef<HTMLSpanElement>(null);

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
    const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
    const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
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
        { name: 'Referrals', path: '/v2/referrals' },
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
    const walletMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsWalletMenuOpen(false);
    }, isWalletMenuOpen);
    const rpcMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsRpcDropdownOpen(false);
    }, isRpcDropdownOpen);
    const depositMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsDepositDropdownOpen(false);
    }, isDepositDropdownOpen);

    const moreDropdownRef = useOutsideClick<HTMLDivElement>(() => {
        setIsMoreDropdownOpen(false);
    }, isMoreDropdownOpen);

    const helpDropdownRef = useOutsideClick<HTMLDivElement>(() => {
        setIsHelpDropdownOpen(false);
    }, isHelpDropdownOpen);

    // logic to open and close modals
    const appSettingsModal = useModal('closed');
    const referralCodeModal = useModal('closed');

    // temp handler to manually toggle referral code modal
    useKeydown('m', referralCodeModal.toggle, [
        JSON.stringify(referralCodeModal),
    ]);

    // event handler to close dropdown menus on `Escape` keydown
    useKeydown(
        'Escape',
        () => {
            setIsDepositDropdownOpen(false);
            setIsRpcDropdownOpen(false);
            setIsWalletMenuOpen(false);
            setIsHelpDropdownOpen(false);
            setIsMoreDropdownOpen(false);
            setIsDropdownMenuOpen(false);
        },
        [],
    );

    const shortA = useShortScreen();
    const shortB = useMediaQuery('(max-width: 600px)');
    const isShortScreen: boolean = shortA || shortB;

    const { openDepositModal, openWithdrawModal, PortfolioModalsRenderer } =
        usePortfolioModals();

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
                // referralCodeModal.open();
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

        if (referralCodeFromURL.value && userDataStore.userAddress) {
            const isConfirmed = referralStore.getCode(
                userDataStore.userAddress,
            )?.isConfirmed;
            isConfirmed ||
                referralStore.set(
                    userDataStore.userAddress,
                    referralCodeFromURL.value,
                    false,
                );
        }

        console.log(userDataStore.userAddress);
        const refCode: RefCodeIF | undefined = referralStore.getCode(
            userDataStore.userAddress,
        );
        console.log(refCode);
        if (refCode?.isConfirmed === false) {
            referralCodeModal.open();
        }
        prevIsUserConnected.current = isUserConnected;
    }, [
        isUserConnected,
        userDataStore.referralCode,
        userDataStore.userAddress,
    ]);

    return (
        <>
            <header id={'pageHeader'} className={styles.container}>
                <Link to='/' style={{ marginLeft: '10px' }} viewTransition>
                    <img
                        src='/images/favicon.svg'
                        alt='Perps Logo'
                        width='70px'
                        height='70px'
                        loading='eager'
                    />
                </Link>
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
                            href='/trade'
                            // target='_blank'
                            // rel='noopener noreferrer'
                            className={styles.ambientmm}
                        >
                            Ambient AMM
                        </a>
                    </Tooltip>
                </nav>
                <div className={styles.rightSide}>
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
                                        openWithdrawModal={openWithdrawModal}
                                    />
                                )}
                            </section>
                        ) : (
                            <div
                                className={styles.depositButtonPlaceholder}
                                aria-hidden
                            />
                        )}
                    </span>

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
                        className={`${!isUserConnected ? `plausible-event-name=Login+Button+Click plausible-event-buttonLocation=Page+Header` : ''}`}
                        ref={sessionButtonRef}
                    >
                        <SessionButton />
                    </span>

                    {isUserConnected && (
                        <section
                            style={{ position: 'relative' }}
                            ref={walletMenuRef}
                        >
                            {/* {isUserConnected && (
                                <button
                                    className={styles.walletButton}
                                    onClick={() =>
                                        setIsWalletMenuOpen(!isWalletMenuOpen)
                                    }
                                >
                                    <LuWallet size={18} /> Miyuki.eth
                                </button>
                            )} */}

                            {/* {isWalletMenuOpen && isUserConnected && (
                                <WalletDropdown
                                    isWalletMenuOpen={isWalletMenuOpen}
                                    setIsWalletMenuOpen={setIsWalletMenuOpen}
                                    setIsUserConnected={setIsUserConnected}
                                    isDropdown
                                />
                            )} */}
                        </section>
                    )}
                    <section
                        style={{
                            position: 'relative',
                        }}
                        ref={helpDropdownRef}
                    >
                        {/* <button
                            className={styles.helpButton}
                            onClick={() =>
                                setIsHelpDropdownOpen(!isHelpDropdownOpen)
                            }
                        >
                            <LuCircleHelp
                                size={18}
                                color='var(--text2)'
                            />
                        </button> */}

                        {isHelpDropdownOpen && (
                            <HelpDropdown
                                setIsHelpDropdownOpen={setIsHelpDropdownOpen}
                            />
                        )}
                    </section>

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
                    <AppOptions />
                </Modal>
            )}
            {referralCodeModal.isOpen && (
                <Modal
                    close={referralCodeModal.close}
                    position='center'
                    title='Referral Code'
                >
                    <ReferralCodeModal
                        close={referralCodeModal.close}
                        refCode={userDataStore.refCode.value}
                        handleConfirm={(): void => {
                            const refCode = referralStore.getCode(
                                userDataStore.userAddress,
                            );
                            if (refCode) {
                                referralStore.confirmCode(
                                    userDataStore.userAddress,
                                    refCode.value,
                                );
                            }
                        }}
                    />
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
