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

import './css/app.css';
import './css/index.css';
import { WsObserverProvider } from './hooks/useWsObserver';
import { useDebugStore } from './stores/DebugStore';
import RuntimeDomManipulation from './components/Core/RuntimeDomManipulation';
import { useLinkGen, type useLinkGenMethodsIF } from './hooks/useLinkGen';

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

// Added loading component for async operations
function LoadingIndicator() {
    return <div className='loading-indicator'>Loading...</div>;
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
    // Use memoized value to prevent unnecessary re-renders
    const { wsUrl } = useDebugStore();

    // listing announcements here will populate the announcements bar
    // ... in the DOM (check styling before pushing)
    const announcements: string[] = ['Hello there'];

    return (
        <Layout>
            <WsObserverProvider url={wsUrl}>
                <div className='root-container'>
                    {/* Added error boundary for header */}
                    <ComponentErrorBoundary>
                        <PageHeader />
                    </ComponentErrorBoundary>

                    {
                        <ComponentErrorBoundary>
                            <style>
                                {`
                            @keyframes marquee {
                                0% {
                                    transform: translateX(100%);
                                }
                                100% {
                                    transform: translateX(-100%);
                                }
                            }
                            `}
                            </style>
                            <aside
                                style={{
                                    height: '100px',
                                    width: '100%',
                                    overflow: 'hidden',
                                    backgroundColor: 'green',
                                    fontSize: 'var(--font-size-s)',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        whiteSpace: 'nowrap',
                                        animation:
                                            'marquee 25s linear infinite',
                                    }}
                                >
                                    {announcements.map((a: string) => (
                                        <p
                                            key={a}
                                            style={{ paddingLeft: '50px' }}
                                        >
                                            {a}
                                        </p>
                                    ))}
                                </div>
                            </aside>
                        </ComponentErrorBoundary>
                    }

                    <main className='content'>
                        {/*  Added Suspense for async content loading */}
                        <Suspense fallback={<LoadingIndicator />}>
                            <ComponentErrorBoundary>
                                <Outlet />
                            </ComponentErrorBoundary>
                        </Suspense>
                    </main>

                    {/* Added error boundary for notifications */}
                    <ComponentErrorBoundary>
                        <Notifications />
                    </ComponentErrorBoundary>
                </div>
                <RuntimeDomManipulation />
            </WsObserverProvider>
        </Layout>
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
            {stack && (
                <pre>
                    <code>{stack}</code>
                </pre>
            )}
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
