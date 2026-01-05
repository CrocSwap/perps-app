import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
    RouterProvider,
    createBrowserRouter,
    useRouteError,
    isRouteErrorResponse,
} from 'react-router';
import Root from './root';

// Check if error is a chunk/module loading failure (typically happens offline)
function isChunkLoadError(error: unknown): boolean {
    if (error instanceof Error) {
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
    return false;
}

// Route error boundary component
function RouteErrorBoundary() {
    const error = useRouteError();
    const isOffline = isChunkLoadError(error);

    if (isRouteErrorResponse(error)) {
        return (
            <div className='error-fallback'>
                <h2>
                    {error.status} {error.statusText}
                </h2>
                <p>{error.data}</p>
                <button onClick={() => window.location.reload()}>
                    Refresh Page
                </button>
            </div>
        );
    }

    if (isOffline) {
        return (
            <div className='error-fallback error-fallback--offline'>
                <h2>Unable to load page</h2>
                <p>
                    It looks like you're offline or have a slow connection.
                    Please check your internet connection and try again.
                </p>
                <div className='error-fallback__buttons'>
                    <button onClick={() => window.history.back()}>
                        Go Back
                    </button>
                    <button onClick={() => window.location.reload()}>
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='error-fallback'>
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred.</p>
            <button onClick={() => window.location.reload()}>
                Refresh Page
            </button>
        </div>
    );
}

const router = createBrowserRouter([
    {
        Component: Root,
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/home/home');
                    return { Component };
                },
            },
            {
                path: 'v2/trade/:marketId?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/trade');
                    return { Component };
                },
            },
            {
                path: 'v2/strategies',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/strategies/strategies');
                    return { Component };
                },
            },
            {
                path: 'v2/strategies/new',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/strategies/newStrategy');
                    return { Component };
                },
            },
            {
                path: 'v2/strategies/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/strategies/StrategyDetail');
                    return { Component };
                },
            },
            {
                path: 'v2/strategies/:address/edit',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/strategies/editStrategy');
                    return { Component };
                },
            },
            {
                path: 'v2/vaults',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/vaults/vaultsNew');
                    return { Component };
                },
            },
            {
                path: 'v2/vaults/:vaultAddress',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/vaults/vaultDetails');
                    return { Component };
                },
            },
            {
                path: 'v2/leaderboard',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/leaderboard/leaderboard');
                    return { Component };
                },
            },
            {
                path: 'v2/points',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/points/points');
                    return { Component };
                },
            },
            {
                path: 'v2/portfolio/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/portfolio/portfolio');
                    return { Component };
                },
            },
            {
                path: 'v2/portfolio/:address?/transactions',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/portfolio/portfolio');
                    return { Component };
                },
            },
            {
                path: 'v2/referrals',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/referrals/referrals');
                    return { Component };
                },
            },
            {
                path: 'v2/affiliates',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/affiliates/affiliates');
                    return { Component };
                },
            },
            {
                path: 'v2/more',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/more/more');
                    return { Component };
                },
            },
            {
                path: 'v2/testpage',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/testpage/testpage');
                    return { Component };
                },
            },
            {
                path: 'v2/subaccounts',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/subaccounts/subaccounts');
                    return { Component };
                },
            },
            {
                path: 'v2/positions',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/positions/positions');
                    return { Component };
                },
            },
            {
                path: 'v2/orderHistory/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/orderHistory/orderHistory');
                    return { Component };
                },
            },
            {
                path: 'v2/tradeHistory/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/tradeHistory/tradeHistory');
                    return { Component };
                },
            },
            {
                path: 'v2/twapHistory/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/twapHistory/twapHistory');
                    return { Component };
                },
            },
            {
                path: 'v2/openOrders/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/openOrders/openOrders');
                    return { Component };
                },
            },
            {
                path: 'v2/twapFillHistory/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/twapFillHistory/twapFillHistory');
                    return { Component };
                },
            },
            {
                path: 'v2/depositsandwithdrawals/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/depositsandwithdrawals/depositsandwithdrawals');
                    return { Component };
                },
            },
            {
                path: 'v2/fundingHistory/:address?',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/fundingHistory/fundingHistory');
                    return { Component };
                },
            },
            {
                path: 'v2/showcase',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/showcase/showcase');
                    return { Component };
                },
            },
            {
                path: 'v2/showcase/buttons',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/showcase/buttonShowcase/buttonShowcase');
                    return { Component };
                },
            },
            {
                path: 'v2/showcase/modals',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/showcase/modalShowcase/modalShowcase');
                    return { Component };
                },
            },
            {
                path: 'v2/showcase/tabs',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/showcase/tabShowcase/tabShowcase');
                    return { Component };
                },
            },
            {
                path: 'v2/terms',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/terms/terms');
                    return { Component };
                },
            },
            {
                path: 'v2/privacy',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/privacy/privacy');
                    return { Component };
                },
            },
            {
                path: '*',
                lazy: async () => {
                    const { default: Component } =
                        await import('./routes/notFound/notFound');
                    return { Component };
                },
            },
        ],
    },
]);

createRoot(document).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
