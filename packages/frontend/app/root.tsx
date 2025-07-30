import React, { Suspense, useEffect } from 'react';
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
import { MARKET_WS_ENDPOINT, USER_WS_ENDPOINT } from './utils/Constants';
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
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className='component-error'>
                    <h3>Something went wrong</h3>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export function Layout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '../tv/datafeeds/udf/dist/bundle.js';
        script.async = true;
        script.onerror = (error) => {
            console.error('Failed to load TradingView script:', error);
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script when component unmounts
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    return (
        <html lang='en'>
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
                {/* Preconnect to Google Fonts domains */}
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

                {/* Single consolidated font request with all needed weights and families */}
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
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
                {/* Removed inline script - now loading dynamically in useEffect */}
            </body>
        </html>
    );
}

export default function App() {
    // Use memoized value to prevent unnecessary re-renders
    const { wsEnvironment } = useDebugStore();
    const location = useLocation();
    const isHomePage = location.pathname === '/' || location.pathname === '';
    return (
        <>
            <Layout>
                <FogoSessionProvider
                    endpoint='https://testnet.fogo.io/'
                    {...(window.location.hostname === 'localhost' && {
                        domain: 'https://perps.ambient.finance',
                    })}
                    tokens={[
                        // NATIVE_MINT.toBase58(),
                        'fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry',
                    ]}
                    defaultRequestedLimits={{
                        // [NATIVE_MINT.toBase58()]: 1_500_000_000n,
                        fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry:
                            1_000_000_000n,
                    }}
                    enableUnlimited={true}
                >
                    <AppProvider>
                        <SdkProvider
                            environment={wsEnvironment}
                            marketEndpoint={MARKET_WS_ENDPOINT}
                            userEndpoint={USER_WS_ENDPOINT}
                        >
                            <TutorialProvider>
                                <WsConnectionChecker />
                                <WebSocketDebug />
                                <div className='root-container'>
                                    {/* Added error boundary for header */}
                                    <ComponentErrorBoundary>
                                        <PageHeader />
                                    </ComponentErrorBoundary>
                                    <main
                                        className={`content ${isHomePage ? 'home-page' : ''}`}
                                    >
                                        {/*  Added Suspense for async content loading */}
                                        <Suspense
                                            fallback={<LoadingIndicator />}
                                        >
                                            <ComponentErrorBoundary>
                                                <Outlet />
                                            </ComponentErrorBoundary>
                                        </Suspense>
                                    </main>
                                    {/* <ComponentErrorBoundary>
                                        <footer className='mobile-footer'>
                                            <MobileFooter />
                                        </footer>
                                    </ComponentErrorBoundary> */}

                                    {/* Added error boundary for notifications */}
                                    <ComponentErrorBoundary>
                                        <Notifications />
                                    </ComponentErrorBoundary>
                                </div>
                            </TutorialProvider>
                            <RuntimeDomManipulation />
                        </SdkProvider>
                    </AppProvider>
                </FogoSessionProvider>
            </Layout>
        </>
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
