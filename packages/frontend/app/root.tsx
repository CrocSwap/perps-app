import React, { Suspense, useEffect, useState } from 'react';
import { RestrictedSiteMessage } from '~/components/RestrictedSiteMessage/RestrictedSiteMessage';
import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
    useRouteError,
} from 'react-router';

// Components
import Notifications from '~/components/Notifications/Notifications';
// import LoadingIndicator from './components/LoadingIndicator/LoadingIndicator'; // temporarily disabled
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
import { FogoSessionProvider } from '@fogo/sessions-sdk-react';
import { WsObserverProvider } from './contexts/useWsObserver';

// Config
import {
    MARKET_WS_ENDPOINT,
    RPC_ENDPOINT,
    USER_WS_ENDPOINT,
    SHOULD_LOG_ANALYTICS,
    SPLIT_TEST_VERSION,
    IS_RESTRICTED_SITE,
} from './utils/Constants';
import packageJson from '../package.json';
import { useDebugStore } from './stores/DebugStore';

// Styles
import './css/app.css';
import './css/index.css';
import { getResolutionSegment } from './utils/functions/getSegment';
import LogoLoadingIndicator from './components/LoadingIndicator/LogoLoadingIndicator';
import { GlobalModalHost } from './components/Modal/GlobalModalHost';
import { useModal } from './hooks/useModal';
import Modal from './components/Modal/Modal';

// Error Boundary Component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className='error-fallback'>
                    <h2>Something went wrong</h2>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Document Shell Component
export function Document({ children }: { children: React.ReactNode }) {
    const [innerHeight, setInnerHeight] = useState<number>();
    const [innerWidth, setInnerWidth] = useState<number>();

    useEffect(() => {
        // Client-side only
        if (typeof window === 'undefined') return;

        // Load TradingView script
        const script = document.createElement('script');
        script.src = '../tv/datafeeds/udf/dist/bundle.js';
        script.async = true;
        script.onerror = (error) =>
            console.error('Failed to load TradingView script:', error);
        document.head.appendChild(script);

        // Set viewport dimensions
        const handleResize = () => {
            setInnerHeight(window.innerHeight);
            setInnerWidth(window.innerWidth);
        };

        // Initial set
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            // Don't remove the script to prevent errors
        };
    }, []);

    return (
        <html lang='en'>
            <head>
                <meta charSet='utf-8' />
                {/* Restrict styles and fonts to self-hosted only so package @import to Google Fonts is blocked */}
                <meta
                    httpEquiv='Content-Security-Policy'
                    content="style-src 'self' 'unsafe-inline'; font-src 'self' data: blob:;"
                />
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1'
                />
                <link rel='icon' href='/images/favicon.ico' sizes='48x48' />
                <link
                    rel='icon'
                    href='/images/favicon.svg'
                    sizes='any'
                    type='image/svg+xml'
                />
                <link
                    rel='apple-touch-icon'
                    href='/images/apple-touch-icon-180x180.png'
                />
                <link rel='manifest' href='/manifest.webmanifest' />
                {/* Self-hosted fonts stylesheet (will take effect once /public/fonts/*.woff2 exist) */}
                <link rel='stylesheet' href='/css/fonts.css' />
                <Meta />
                <Links />
                {/* Preload self-hosted fonts */}
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/lexenddeca-100.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/lexenddeca-300.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/robotomono-400.woff2'
                    crossOrigin='anonymous'
                />
                {/* Preload DM Sans weights used across UI */}
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/dmsans-400.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/dmsans-500.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/dmsans-700.woff2'
                    crossOrigin='anonymous'
                />
                {/* Preload Funnel Display weights used by sessions-sdk */}
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/funneldisplay-300.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/funneldisplay-400.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/funneldisplay-500.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/funneldisplay-600.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/funneldisplay-700.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='/fonts/funneldisplay-800.woff2'
                    crossOrigin='anonymous'
                />
                {SHOULD_LOG_ANALYTICS && (
                    <script
                        defer
                        event-version={packageJson.version}
                        event-windowheight={
                            innerHeight
                                ? getResolutionSegment(innerHeight)
                                : undefined
                        }
                        event-windowwidth={
                            innerWidth
                                ? getResolutionSegment(innerWidth)
                                : undefined
                        }
                        event-splittestversion={SPLIT_TEST_VERSION}
                        data-domain='perps.ambient.finance'
                        src='https://plausible.io/js/script.pageview-props.tagged-events.js'
                    ></script>
                )}
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

// Main App Component
export default function App() {
    const { wsEnvironment } = useDebugStore();
    const location = useLocation();
    const isHomePage = location.pathname === '/' || location.pathname === '';

    const restrictedSiteModal = useModal('closed');

    return (
        <Document>
            <FogoSessionProvider
                endpoint={RPC_ENDPOINT}
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
            >
                <AppProvider>
                    <UnifiedMarginDataProvider>
                        <MarketDataProvider>
                            <WsObserverProvider
                                url={`${MARKET_WS_ENDPOINT}/ws`}
                            >
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
                            </WsObserverProvider>
                        </MarketDataProvider>
                    </UnifiedMarginDataProvider>
                </AppProvider>
            </FogoSessionProvider>
        </Document>
    );
}

// Error Page Component
export function ErrorPage() {
    const error = useRouteError();
    console.error(error);

    if (isRouteErrorResponse(error)) {
        return (
            <div className='error-page'>
                <h1>
                    {error.status} {error.statusText}
                </h1>
                <p>{error.data?.message || 'An error occurred'}</p>
            </div>
        );
    }

    return (
        <div className='error-page'>
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>
                    {error instanceof Error ? error.message : 'Unknown error'}
                </i>
            </p>
            <button onClick={() => window.location.reload()}>
                Reload Page
            </button>
        </div>
    );
}
