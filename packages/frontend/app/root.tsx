import React, { Suspense, useEffect } from 'react';
import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from 'react-router';
import Notifications from '~/components/Notifications/Notifications';
import type { Route } from './+types/root';
import RuntimeDomManipulation from './components/Core/RuntimeDomManipulation';
import LoadingIndicator from './components/LoadingIndicator/LoadingIndicator';
import MobileFooter from './components/MobileFooter/MobileFooter';
import NoConnectionIndicator from './components/NoConnectionIndicator/NoConnectionIndicator';
import PageHeader from './components/PageHeader/PageHeader';
import WsReconnectingIndicator from './components/WsReconnectingIndicator/WsReconnectingIndicator';
import { AppProvider } from './contexts/AppContext';
import './css/app.css';
import './css/index.css';
import { SdkProvider } from './hooks/useSdk';
import { TutorialProvider } from './hooks/useTutorial';
import { useDebugStore } from './stores/DebugStore';
import { useTradeDataStore } from './stores/TradeDataStore';

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
    const { wsEnvironment } = useDebugStore();
    const { setInternetConnected, internetConnected, wsReconnecting } =
        useTradeDataStore();

    // Clear update flag on load
    useEffect(() => {
        localStorage.removeItem('updateInProgress');
    }, []);

    // Service worker registration and update handling
    useEffect(() => {
        if (
            process.env.NODE_ENV === 'production' &&
            'serviceWorker' in navigator
        ) {
            let refreshing = false;

            // Listen for the new service worker taking control
            const controllerChangeHandler = () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            };
            navigator.serviceWorker.addEventListener(
                'controllerchange',
                controllerChangeHandler,
            );

            navigator.serviceWorker.register('/sw.js').then((registration) => {
                // Only show update prompt if a new SW is found while the page is already controlled
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (
                                newWorker.state === 'installed' &&
                                navigator.serviceWorker.controller // Only if page is already controlled (not first load)
                            ) {
                                // Prompt user to refresh
                                // Show your custom UI here instead of confirm()
                                if (
                                    window.confirm(
                                        'A new version is available. Reload now?',
                                    )
                                ) {
                                    newWorker.postMessage({
                                        action: 'skipWaiting',
                                    });
                                }
                            }
                        });
                    }
                });
            });

            return () => {
                navigator.serviceWorker.removeEventListener(
                    'controllerchange',
                    controllerChangeHandler,
                );
            };
        }
    }, []);

    useEffect(() => {
        const onlineListener = () => {
            setInternetConnected(true);
        };
        const offlineListener = () => {
            setInternetConnected(false);
        };

        window.addEventListener('online', onlineListener);
        window.addEventListener('offline', offlineListener);

        return () => {
            window.removeEventListener('online', onlineListener);
            window.removeEventListener('offline', offlineListener);
        };
    }, []);

    return (
        <>
            <Layout>
                <AppProvider>
                    <SdkProvider environment={wsEnvironment}>
                        {!internetConnected && <NoConnectionIndicator />}
                        {wsReconnecting && <WsReconnectingIndicator />}
                        <TutorialProvider>
                            <div className='root-container'>
                                {/* Added error boundary for header */}
                                <ComponentErrorBoundary>
                                    <PageHeader />
                                </ComponentErrorBoundary>
                                <main className='content'>
                                    {/*  Added Suspense for async content loading */}
                                    <Suspense fallback={<LoadingIndicator />}>
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

                                {/* Added error boundary for notifications */}
                                <ComponentErrorBoundary>
                                    <Notifications />
                                </ComponentErrorBoundary>
                            </div>
                        </TutorialProvider>
                        <RuntimeDomManipulation />
                    </SdkProvider>
                </AppProvider>
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
