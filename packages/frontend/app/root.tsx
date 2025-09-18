import React, { Suspense, useEffect, useState } from 'react';
import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
} from 'react-router';
import Notifications from '~/components/Notifications/Notifications';
import type { Route } from './+types/root';
import RuntimeDomManipulation from './components/Core/RuntimeDomManipulation';
import LoadingIndicator from './components/LoadingIndicator/LoadingIndicator';
// import MobileFooter from './components/MobileFooter/MobileFooter';
import PageHeader from './components/PageHeader/PageHeader';
import WebSocketDebug from './components/WebSocketDebug/WebSocketDebug';
import WsConnectionChecker from './components/WsConnectionChecker/WsConnectionChecker';
import { AppProvider } from './contexts/AppContext';
import './css/app.css';
import './css/index.css';
import { SdkProvider } from './hooks/useSdk';
import { TutorialProvider } from './hooks/useTutorial';
import { useDebugStore } from './stores/DebugStore';

import { FogoSessionProvider } from '@fogo/sessions-sdk-react';
import {
    MARKET_WS_ENDPOINT,
    RPC_ENDPOINT,
    SHOULD_LOG_ANALYTICS,
    SPLIT_TEST_VERSION,
    USER_WS_ENDPOINT,
} from './utils/Constants';
import { MarketDataProvider } from './contexts/MarketDataContext';
import { UnifiedMarginDataProvider } from './hooks/useUnifiedMarginData';
import packageJson from '../package.json';
import { getResolutionSegment } from './utils/functions/getSegment';
import MobileFooter from './components/MobileFooter/MobileFooter';
// import { NATIVE_MINT } from '@solana/spl-token';

// Added ComponentErrorBoundary to prevent entire app from crashing when a component fails
class ComponentErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Component error:', error, info);

        // Log error to Plausible
        if (
            typeof window !== 'undefined' &&
            typeof window.plausible === 'function'
        ) {
            // Truncate componentStack to be less than 2000 bytes
            const maxBytes = 2000;
            let componentStack = info.componentStack || '';

            // Convert to Buffer to handle multi-byte characters correctly
            const encoder = new TextEncoder();
            const encoded = encoder.encode(componentStack);

            if (encoded.length > maxBytes) {
                // Create a new Uint8Array with maxBytes length
                const truncated = new Uint8Array(maxBytes);
                // Copy the first maxBytes - 3 bytes (for '...')
                truncated.set(encoded.subarray(0, maxBytes - 3));
                // Add ellipsis
                truncated.set([0x2e, 0x2e, 0x2e], maxBytes - 3);
                // Convert back to string
                componentStack = new TextDecoder('utf-8', {
                    fatal: false,
                }).decode(truncated);
            }

            window.plausible('Component Error', {
                props: {
                    errorMessage: error.message,
                    componentStack: componentStack,
                    errorName: error.name,
                },
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '20px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        backgroundColor: 'var(--dark2)',
                    }}
                >
                    <h3 style={{ marginBottom: '16px' }}>
                        Something went wrong
                    </h3>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent1)',
                            cursor: 'pointer',
                            padding: '0',
                            font: 'inherit',
                            textDecoration: 'underline',
                            display: 'inline',
                            marginTop: '8px',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Layout component has been merged into App component to fix hydration issues

export default function App() {
    const { wsEnvironment } = useDebugStore();
    const location = useLocation();
    const isHomePage = location.pathname === '/' || location.pathname === '';
    const [innerHeight, setInnerHeight] = useState<number>();
    const [innerWidth, setInnerWidth] = useState<number>();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Set window dimensions
        if (typeof window !== 'undefined') {
            setInnerHeight(window.innerHeight);
            setInnerWidth(window.innerWidth);

            // Load TradingView script
            const script = document.createElement('script');
            script.src = '../tv/datafeeds/udf/dist/bundle.js';
            script.async = true;
            script.onerror = (error) => {
                console.error('Failed to load TradingView script:', error);
            };
            document.body.appendChild(script);

            // Mark as mounted after the next tick to ensure styles are loaded
            const timer = setTimeout(() => {
                document.documentElement.classList.add('mounted');
                document.body.classList.add('mounted');
                setIsMounted(true);
            }, 0);

            return () => {
                clearTimeout(timer);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
        }
    }, []);

    // Add global styles to prevent FOUC
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            body:not(.mounted) {
                visibility: hidden;
                opacity: 0;
            }
            body.mounted {
                visibility: visible;
                opacity: 1;
                transition: opacity 0.2s ease-in;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <html lang='en' className={isMounted ? 'mounted' : ''}>
            <head>
                <meta charSet='utf-8' />
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
                <Meta />
                <link
                    rel='preconnect'
                    href='https://fonts.googleapis.com'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preconnect'
                    href='https://fonts.gstatic.com'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='style'
                    href='https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Funnel+Display:wght@300..800&family=Inconsolata:wght@500&family=Lexend+Deca:wght@100;300&family=Roboto+Mono:wght@400&display=swap&display=swap'
                />
                <link
                    rel='stylesheet'
                    href='https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Funnel+Display:wght@300..800&family=Inconsolata:wght@500&family=Lexend+Deca:wght@100;300&family=Roboto+Mono:wght@400&display=swap&display=swap'
                    media='print'
                    onLoad={(e) => {
                        const target = e.target as HTMLLinkElement;
                        target.media = 'all';
                    }}
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='https://fonts.gstatic.com/s/lexenddeca/v24/K2F1fZFYk-dHSE0UPPuwQ5qnJy8.woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    as='font'
                    type='font/woff2'
                    href='https://fonts.gstatic.com/s/funneldisplay/v2/B50WF7FGv37QNVWgE0ga--4Pbb6dDYs.woff2'
                    crossOrigin='anonymous'
                />
                <Links />
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
            <body className={isMounted ? 'mounted' : ''}>
                <FogoSessionProvider
                    endpoint={RPC_ENDPOINT}
                    domain='https://perps.ambient.finance'
                    tokens={['fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry']}
                    defaultRequestedLimits={{
                        fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry:
                            1_000_000_000n,
                    }}
                    enableUnlimited={true}
                >
                    <AppProvider>
                        <UnifiedMarginDataProvider>
                            <MarketDataProvider>
                                <SdkProvider
                                    environment={wsEnvironment}
                                    marketEndpoint={MARKET_WS_ENDPOINT}
                                    userEndpoint={USER_WS_ENDPOINT}
                                >
                                    <TutorialProvider>
                                        <WsConnectionChecker />
                                        <WebSocketDebug />
                                        <div className='root-container'>
                                            <ComponentErrorBoundary>
                                                <PageHeader />
                                            </ComponentErrorBoundary>
                                            <main
                                                className={`content ${isHomePage ? 'home-page' : ''}`}
                                            >
                                                <Suspense
                                                    fallback={
                                                        <LoadingIndicator />
                                                    }
                                                >
                                                    <ComponentErrorBoundary>
                                                        <Outlet />
                                                    </ComponentErrorBoundary>
                                                </Suspense>
                                            </main>
                                            <ComponentErrorBoundary>
                                                <footer className='mobile-footer'>
                                                    <MobileFooter />
                                                </footer>
                                            </ComponentErrorBoundary>
                                            <ComponentErrorBoundary>
                                                <Notifications />
                                            </ComponentErrorBoundary>
                                        </div>
                                    </TutorialProvider>
                                    <RuntimeDomManipulation />
                                </SdkProvider>
                            </MarketDataProvider>
                        </UnifiedMarginDataProvider>
                    </AppProvider>
                </FogoSessionProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = 'Oops!';
    let details = 'An unexpected error occurred.';
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error';
        details =
            error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className='content error-boundary'>
            <h1>{message}</h1>
            <p>{details}</p>
            {stack ? (
                <pre>
                    <code>{stack}</code>
                </pre>
            ) : error ? (
                <pre>
                    <code>{error.toString()}</code>
                </pre>
            ) : null}
            {/*  Added refresh button for better user experience */}
            <button
                onClick={() => window.location.reload()}
                className='retry-button'
            >
                Reload Page
            </button>
        </main>
    );
}
