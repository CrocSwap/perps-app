import React, { Suspense, useEffect, useRef } from 'react';
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

    // Add this to a top-level component for debugging purposes only
    useEffect(() => {
        const originalRemoveChild = Node.prototype.removeChild;

        // Use a type assertion to satisfy TypeScript
        Node.prototype.removeChild = function <T extends Node>(child: T): T {
            try {
                return originalRemoveChild.call(this, child) as T;
            } catch (e) {
                console.error('RemoveChild error:', e);
                console.log('Parent:', this);
                console.log('Child to remove:', child);
                console.trace('Stack trace');
                throw e;
            }
        };

        return () => {
            Node.prototype.removeChild = originalRemoveChild;
        };
    }, []);

    useEffect(() => {
        const errorHandler = (event: ErrorEvent) => {
            if (
                event.error &&
                event.error.message &&
                event.error.message.includes('removeChild')
            ) {
                console.error('RemoveChild error occurred:', event.error);
                console.trace('Stack trace at error handler');
                // Optionally prevent default error handling
                event.preventDefault();
            }
        };

        window.addEventListener('error', errorHandler);

        return () => {
            window.removeEventListener('error', errorHandler);
        };
    }, []);

    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        // Check if script already exists
        const existingScript = document.querySelector(
            'script[src*="bundle.js"]',
        );
        if (existingScript) return;
        console.log({ existingScript }, 'Loading TradingView script...');

        const script = document.createElement('script');
        script.src = '/tv/datafeeds/udf/dist/bundle.js'; // Use absolute path
        script.async = true;
        script.onerror = (error) => {
            console.error('Failed to load TradingView script:', error);
        };
        document.head.appendChild(script);
        scriptRef.current = script;

        // return () => {
        //     // Only remove if it's the script we added
        //     if (
        //         scriptRef.current &&
        //         document.head.contains(scriptRef.current)
        //     ) {
        //         console.log({ scriptRef }, 'Removing TradingView script...');
        //         document.head.removeChild(scriptRef.current);
        //     }
        // };
    }, []);

    return (
        <Layout>
            <WsObserverProvider url={wsUrl}>
                <div className='root-container'>
                    {/* Added error boundary for header */}
                    <ComponentErrorBoundary>
                        <header className='header'>
                            <PageHeader />
                        </header>
                    </ComponentErrorBoundary>

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
