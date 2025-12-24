import React, { Suspense, useEffect } from 'react';
import './i18n'; // i18n MUST be imported before any components
import { RestrictedSiteMessage } from '~/components/RestrictedSiteMessage/RestrictedSiteMessage';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { init as initPlausible } from '@plausible-analytics/tracker';

// Components
import Notifications from '~/components/Notifications/Notifications';
import PageHeader from './components/PageHeader/PageHeader';
import MobileFooter from './components/MobileFooter/MobileFooter';
import WebSocketDebug from './components/WebSocketDebug/WebSocketDebug';
import WsConnectionChecker from './components/WsConnectionChecker/WsConnectionChecker';
import RuntimeDomManipulation from './components/Core/RuntimeDomManipulation';
import AnnouncementBannerHost from './components/AnnouncementBanner/AnnouncementBannerHost';

// Providers
import { AppProvider } from './contexts/AppContext';
import { MarketDataProvider } from './contexts/MarketDataContext';
import { SdkProvider } from './hooks/useSdk';
import { TutorialProvider } from './hooks/useTutorial';
import { UnifiedMarginDataProvider } from './hooks/useUnifiedMarginData';
import { FogoSessionProvider, Network } from '@fogo/sessions-sdk-react';
import { WsProvider } from './contexts/WsContext';
import {
    KeyboardShortcutsProvider,
    useKeyboardShortcuts,
} from './contexts/KeyboardShortcutsContext';

// Config
import {
    MARKET_WS_ENDPOINT,
    USER_WS_ENDPOINT,
    IS_RESTRICTED_SITE,
    SHOULD_LOG_ANALYTICS,
    SPLIT_TEST_VERSION,
} from './utils/Constants';
import packageJson from '../package.json';
import { getDefaultLanguage } from './utils/functions/getDefaultLanguage';
import { getResolutionSegment } from './utils/functions/getSegment';
import { useDebugStore } from './stores/DebugStore';
import { useAppSettings } from './stores/AppSettingsStore';

// Styles
import './css/app.css';
import './css/index.css';
import LogoLoadingIndicator from './components/LoadingIndicator/LogoLoadingIndicator';
import { GlobalModalHost } from './components/Modal/GlobalModalHost';
import { useModal } from './hooks/useModal';
import Modal from './components/Modal/Modal';
import { FuulProvider } from './contexts/FuulContext';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal/KeyboardShortcutsModal';
import { useTranslation } from 'react-i18next';
import {
    getKeyboardShortcutById,
    getKeyboardShortcutCategories,
    matchesShortcutEvent,
} from './utils/keyboardShortcuts';

// Wrapper component that uses the keyboard shortcuts context
function KeyboardShortcutsModalWrapper() {
    const { isOpen, close, toggle } = useKeyboardShortcuts();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { navigationKeyboardShortcutsEnabled } = useAppSettings();

    // Global keyboard shortcut listener for Shift+/ (?) to open keyboard shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const categories = getKeyboardShortcutCategories(t);
            const shortcutsModalShortcut = getKeyboardShortcutById(
                categories,
                'shortcuts.open',
            );
            const navHomeShortcut = getKeyboardShortcutById(
                categories,
                'navigation.home',
            );
            const navTradeShortcut = getKeyboardShortcutById(
                categories,
                'navigation.trade',
            );
            const navPortfolioShortcut = getKeyboardShortcutById(
                categories,
                'navigation.portfolio',
            );

            const isShortcut =
                !!shortcutsModalShortcut &&
                matchesShortcutEvent(e, shortcutsModalShortcut.keys);

            const isNavigationShortcut =
                navigationKeyboardShortcutsEnabled &&
                ((!!navHomeShortcut &&
                    matchesShortcutEvent(e, navHomeShortcut.keys)) ||
                    (!!navTradeShortcut &&
                        matchesShortcutEvent(e, navTradeShortcut.keys)) ||
                    (!!navPortfolioShortcut &&
                        matchesShortcutEvent(e, navPortfolioShortcut.keys)));

            if (!isShortcut && !isNavigationShortcut) return;

            const target = e.target as HTMLElement | null;

            const isOptedInField = !!target?.closest?.(
                '[data-allow-keyboard-shortcuts="true"]',
            );

            if (!isOptedInField && target) {
                if (target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }

                if (target.tagName === 'INPUT') {
                    const input = target as HTMLInputElement;
                    const isNumericInput = input.inputMode === 'numeric';
                    if (!isNumericInput) {
                        return;
                    }
                }
            }

            if (isShortcut) {
                e.preventDefault();
                toggle();
                return;
            }

            if (isOpen) return;

            e.preventDefault();

            if (
                navTradeShortcut &&
                matchesShortcutEvent(e, navTradeShortcut.keys)
            ) {
                navigate('/v2/trade');
                return;
            }
            if (
                navHomeShortcut &&
                matchesShortcutEvent(e, navHomeShortcut.keys)
            ) {
                navigate('/');
                return;
            }
            if (
                navPortfolioShortcut &&
                matchesShortcutEvent(e, navPortfolioShortcut.keys)
            ) {
                navigate('/v2/portfolio');
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [toggle, navigate, isOpen, t, navigationKeyboardShortcutsEnabled]);

    return <KeyboardShortcutsModal isOpen={isOpen} onClose={close} />;
}

// Check if error is a chunk/module loading failure (typically happens offline)
function isChunkLoadError(error: Error): boolean {
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';
    return (
        message.includes('failed to fetch') ||
        message.includes('loading chunk') ||
        message.includes('loading css chunk') ||
        message.includes('unable to preload') ||
        message.includes('dynamically imported module') ||
        name.includes('chunkloaderror')
    );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; isOfflineError: boolean }
> {
    state = { hasError: false, isOfflineError: false };

    static getDerivedStateFromError(error: Error) {
        return {
            hasError: true,
            isOfflineError: isChunkLoadError(error),
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, isOfflineError: false });
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.state.isOfflineError) {
                return (
                    <div className='error-fallback error-fallback--offline'>
                        <h2>Unable to load page</h2>
                        <p>
                            It looks like you're offline or have a slow
                            connection. Please check your internet connection
                            and try again.
                        </p>
                        <div className='error-fallback__buttons'>
                            <button onClick={this.handleRetry}>
                                Try Again
                            </button>
                            <button onClick={this.handleRefresh}>
                                Refresh Page
                            </button>
                        </div>
                    </div>
                );
            }
            return (
                <div className='error-fallback'>
                    <h2>Something went wrong</h2>
                    <button onClick={this.handleRetry}>Try again</button>
                </div>
            );
        }
        return this.props.children;
    }
}

if (SHOULD_LOG_ANALYTICS) {
    initPlausible({
        domain: 'perps.ambient.finance',
        endpoint: 'https://pls.embindexer.net/ev',
        outboundLinks: true,
        customProperties: {
            version: packageJson.version,
            splittestversion: SPLIT_TEST_VERSION,
            windowheight: getResolutionSegment(innerHeight),
            windowwidth: getResolutionSegment(innerWidth),
            defaultlanguage: getDefaultLanguage(),
            preferredlanguage: navigator.language,
        },
    });
}

// Main App Component (SPA mode)
export default function App() {
    const { wsEnvironment } = useDebugStore();
    const location = useLocation();
    const isHomePage = location.pathname === '/' || location.pathname === '';
    const restrictedSiteModal = useModal('closed');
    const { t } = useTranslation();

    useEffect(() => {
        const { pathname } = location;

        if (pathname.startsWith('/v2/trade')) {
            return;
        }

        let translatedPart = '';

        if (pathname === '/' || pathname === '') {
            document.title = t('meta.title');
            return;
        } else if (pathname.startsWith('/v2/portfolio')) {
            translatedPart = t('pageTitles.portfolio');
        } else if (pathname.startsWith('/v2/referrals')) {
            translatedPart = t('pageTitles.referrals');
        } else if (pathname.startsWith('/v2/affiliates')) {
            translatedPart = t('pageTitles.affiliates');
        } else if (pathname.startsWith('/v2/points')) {
            translatedPart = t('pageTitles.points');
        } else if (pathname.startsWith('/v2/leaderboard')) {
            translatedPart = t('pageTitles.leaderboard');
        } else if (pathname.startsWith('/v2/strategies/new')) {
            translatedPart = t('pageTitles.newStrategy');
        } else if (
            pathname.startsWith('/v2/strategies/') &&
            pathname.endsWith('/edit')
        ) {
            translatedPart = t('pageTitles.editStrategy');
        } else if (pathname.startsWith('/v2/strategies/')) {
            translatedPart = t('pageTitles.strategy');
        } else if (pathname.startsWith('/v2/strategies')) {
            translatedPart = t('pageTitles.strategies');
        } else if (pathname.startsWith('/v2/vaults/')) {
            translatedPart = t('pageTitles.vault');
        } else if (pathname.startsWith('/v2/vaults')) {
            translatedPart = t('pageTitles.vaults');
        } else if (pathname.startsWith('/v2/subaccounts')) {
            translatedPart = t('pageTitles.subAccounts');
        } else if (pathname.startsWith('/v2/positions')) {
            translatedPart = t('pageTitles.positions');
        } else if (pathname.startsWith('/v2/openOrders')) {
            translatedPart = t('pageTitles.openOrders');
        } else if (pathname.startsWith('/v2/orderHistory')) {
            translatedPart = t('pageTitles.orderHistory');
        } else if (pathname.startsWith('/v2/tradeHistory')) {
            translatedPart = t('pageTitles.tradeHistory');
        } else if (pathname.startsWith('/v2/twapFillHistory')) {
            translatedPart = t('pageTitles.twapFillHistory');
        } else if (pathname.startsWith('/v2/twapHistory')) {
            translatedPart = t('pageTitles.twapHistory');
        } else if (pathname.startsWith('/v2/depositsandwithdrawals')) {
            translatedPart = t('pageTitles.depositsAndWithdrawals');
        } else if (pathname.startsWith('/v2/fundingHistory')) {
            translatedPart = t('pageTitles.fundingHistory');
        } else if (pathname.startsWith('/v2/more')) {
            translatedPart = t('pageTitles.more');
        } else if (pathname.startsWith('/v2/terms')) {
            translatedPart = t('pageTitles.termsOfService');
        } else if (pathname.startsWith('/v2/privacy')) {
            translatedPart = t('pageTitles.privacyPolicy');
        } else if (pathname.startsWith('/v2/showcase')) {
            translatedPart = 'Showcase';
        } else if (pathname.startsWith('/v2/testpage')) {
            translatedPart = 'Test Page';
        } else {
            translatedPart = t('pageTitles.pageNotFound');
        }

        document.title = translatedPart
            ? `${translatedPart} | Ambient Finance`
            : 'Ambient Finance';
    }, [location, t]);

    useEffect(() => {
        // Load TradingView script
        const script = document.createElement('script');
        script.src = '../tv/datafeeds/udf/dist/bundle.js';
        script.async = true;
        script.onerror = (error) =>
            console.error('Failed to load TradingView script:', error);
        document.head.appendChild(script);

        return () => {
            // Don't remove the script to prevent errors
        };
    }, []);

    return (
        <FuulProvider>
            <FogoSessionProvider
                network={Network.Testnet}
                domain='https://perps.ambient.finance'
                tokens={['fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry']}
                defaultRequestedLimits={{
                    fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry: 1_000_000_000n,
                }}
                enableUnlimited={true}
                onStartSessionInit={() => {
                    if (IS_RESTRICTED_SITE) {
                        restrictedSiteModal.open();
                    }
                    return !IS_RESTRICTED_SITE;
                }}
                termsOfServiceUrl='/v2/terms'
                privacyPolicyUrl='/v2/privacy'
            >
                <AppProvider>
                    <KeyboardShortcutsProvider>
                        <WsProvider url={`${MARKET_WS_ENDPOINT}/ws`}>
                            <UnifiedMarginDataProvider>
                                <MarketDataProvider>
                                    <SdkProvider
                                        environment={wsEnvironment}
                                        marketEndpoint={MARKET_WS_ENDPOINT}
                                        userEndpoint={USER_WS_ENDPOINT}
                                    >
                                        <TutorialProvider>
                                            <GlobalModalHost>
                                                <ErrorBoundary>
                                                    <WsConnectionChecker />
                                                    <WebSocketDebug />
                                                    <div className='root-container'>
                                                        <div className='header-area'>
                                                            <AnnouncementBannerHost />
                                                            <PageHeader />
                                                        </div>
                                                        <main
                                                            className={`content ${isHomePage ? 'home-page' : ''}`}
                                                        >
                                                            <Suspense
                                                                fallback={
                                                                    <LogoLoadingIndicator />
                                                                }
                                                            >
                                                                <Outlet />
                                                            </Suspense>
                                                        </main>
                                                        <MobileFooter
                                                            onFeedbackClick={() => {
                                                                return;
                                                            }}
                                                        />
                                                        <Notifications />
                                                        {restrictedSiteModal.isOpen && (
                                                            <Modal
                                                                close={() =>
                                                                    restrictedSiteModal.close()
                                                                }
                                                                position={
                                                                    'center'
                                                                }
                                                                title=''
                                                            >
                                                                <RestrictedSiteMessage
                                                                    onClose={
                                                                        restrictedSiteModal.close
                                                                    }
                                                                />
                                                            </Modal>
                                                        )}
                                                    </div>
                                                    <RuntimeDomManipulation />
                                                    <KeyboardShortcutsModalWrapper />
                                                </ErrorBoundary>
                                            </GlobalModalHost>
                                        </TutorialProvider>
                                    </SdkProvider>
                                </MarketDataProvider>
                            </UnifiedMarginDataProvider>
                        </WsProvider>
                    </KeyboardShortcutsProvider>
                </AppProvider>
            </FogoSessionProvider>
        </FuulProvider>
    );
}
