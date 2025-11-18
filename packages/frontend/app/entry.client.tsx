import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import Root from './root';

const router = createBrowserRouter([
    {
        Component: Root,
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/home/home'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/trade/:marketId?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/trade'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/strategies',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/strategies/strategies'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/strategies/new',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/strategies/newStrategy'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/strategies/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/strategies/StrategyDetail'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/strategies/:address/edit',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/strategies/editStrategy'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/vaults',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/vaults/vaultsNew'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/vaults/:vaultAddress',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/vaults/vaultDetails'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/leaderboard',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/leaderboard/leaderboard'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/points',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/points/points'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/portfolio',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/portfolio/portfolio'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/referrals',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/referrals/referrals'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/more',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/more/more'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/testpage',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/testpage/testpage'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/subaccounts',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/subaccounts/subaccounts'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/positions',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/positions/positions'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/orderHistory/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/orderHistory/orderHistory'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/tradeHistory/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/tradeHistory/tradeHistory'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/twapHistory/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/twapHistory/twapHistory'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/openOrders/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/openOrders/openOrders'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/twapFillHistory/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/twapFillHistory/twapFillHistory'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/depositsandwithdrawals/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/depositsandwithdrawals/depositsandwithdrawals'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/fundingHistory/:address?',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/fundingHistory/fundingHistory'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/showcase',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/showcase/showcase'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/showcase/buttons',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/showcase/buttonShowcase/buttonShowcase'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/showcase/modals',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/showcase/modalShowcase/modalShowcase'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/showcase/tabs',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/showcase/tabShowcase/tabShowcase'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/terms',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/terms/terms'
                    );
                    return { Component };
                },
            },
            {
                path: 'v2/privacy',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/privacy/privacy'
                    );
                    return { Component };
                },
            },
            {
                path: '*',
                lazy: async () => {
                    const { default: Component } = await import(
                        './routes/notFound/notFound'
                    );
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
