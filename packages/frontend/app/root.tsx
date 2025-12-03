import React, { Suspense, useEffect } from 'react';
import './i18n'; // i18n MUST be imported before any components
import { RestrictedSiteMessage } from '~/components/RestrictedSiteMessage/RestrictedSiteMessage';
import { Outlet, useLocation } from 'react-router';

// Components
import Notifications from '~/components/Notifications/Notifications';
import PageHeader from './components/PageHeader/PageHeader';
import MobileFooter from './components/MobileFooter/MobileFooter';
import WebSocketDebug from './components/WebSocketDebug/WebSocketDebug';
import WsConnectionChecker from './components/WsConnectionChecker/WsConnectionChecker';
import RuntimeDomManipulation from './components/Core/RuntimeDomManipulation';

// Providers
import { AppProvider } from './contexts/AppContext';
import { MarketDataProvider } from './contexts/MarketDataContext';
import { SdkProvider } from './hooks/useSdk';
import { TutorialProvider } from './hooks/useTutorial';
import { UnifiedMarginDataProvider } from './hooks/useUnifiedMarginData';
import { FogoSessionProvider, Network } from '@fogo/sessions-sdk-react';
import { WsProvider } from './contexts/WsContext';

// Config
import {
    MARKET_WS_ENDPOINT,
    USER_WS_ENDPOINT,
    IS_RESTRICTED_SITE,
} from './utils/Constants';
import { useDebugStore } from './stores/DebugStore';

// Styles
import './css/app.css';
import './css/index.css';
import LogoLoadingIndicator from './components/LoadingIndicator/LogoLoadingIndicator';
import { GlobalModalHost } from './components/Modal/GlobalModalHost';
import { useModal } from './hooks/useModal';
import Modal from './components/Modal/Modal';
import { FuulProvider } from './contexts/FuulContext';

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

// Main App Component (SPA mode)
export default function App() {
    const { wsEnvironment } = useDebugStore();
    const location = useLocation();
    const isHomePage = location.pathname === '/' || location.pathname === '';

    const restrictedSiteModal = useModal('closed');

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
                                                    <PageHeader />
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
                                                    <MobileFooter />
                                                    <Notifications />
                                                    {restrictedSiteModal.isOpen && (
                                                        <Modal
                                                            close={() =>
                                                                restrictedSiteModal.close()
                                                            }
                                                            position={'center'}
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
                                            </ErrorBoundary>
                                        </GlobalModalHost>
                                    </TutorialProvider>
                                </SdkProvider>
                            </MarketDataProvider>
                        </UnifiedMarginDataProvider>
                    </WsProvider>
                </AppProvider>
            </FogoSessionProvider>
        </FuulProvider>
    );
}
