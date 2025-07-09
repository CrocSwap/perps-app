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
import PageHeader from './components/PageHeader/PageHeader';

import RuntimeDomManipulation from './components/Core/RuntimeDomManipulation';
import LoadingIndicator from './components/LoadingIndicator/LoadingIndicator';
import MobileFooter from './components/MobileFooter/MobileFooter';
import VersionUpdateAnnouncement from './components/VersionUpdateAnnouncement/VersionUpdateAnnouncement';
import { AppProvider } from './contexts/AppContext';
import './css/app.css';
import './css/index.css';
import { SdkProvider } from './hooks/useSdk';
import { TutorialProvider } from './hooks/useTutorial';
import { useVersionCheck } from './hooks/useVersionCheck';
import { useDebugStore } from './stores/DebugStore';
import WsConnectionChecker from './components/WsConnectionChecker/WsConnectionChecker';

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
    const { showReload, setShowReload } = useVersionCheck();

    // Use memoized value to prevent unnecessary re-renders
    const { wsEnvironment } = useDebugStore();

    return (
        <>
            <Layout>
                <AppProvider>
                    <SdkProvider environment={wsEnvironment}>
                        <TutorialProvider>
                            <WsConnectionChecker />
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
                        {showReload && (
                            <VersionUpdateAnnouncement
                                onClose={() => {
                                    setShowReload(false);
                                }}
                            />
                        )}
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
