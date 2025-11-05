import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // Renders "routes/home/home.tsx" at "/"
    index('routes/home/home.tsx'),

    route('v2/trade/:marketId?', 'routes/trade.tsx'),

    route('v2/strategies', 'routes/strategies/strategies.tsx'),
    route('v2/strategies/new', 'routes/strategies/newStrategy.tsx'),
    route('v2/strategies/:address?', 'routes/strategies/StrategyDetail.tsx'),
    route('v2/strategies/:address/edit', 'routes/strategies/editStrategy.tsx'),

    // Renders "routes/vaults/vaults.tsx" at "/vaults"
    route('v2/vaults', 'routes/vaults/vaultsNew.tsx'),

    route('v2/vaults/:vaultAddress', 'routes/vaults/vaultDetails.tsx'),

    // Renders "routes/leaderboard/leaderboard.tsx" at "/leaderboard"
    route('v2/leaderboard', 'routes/leaderboard/leaderboard.tsx'),

    // Renders "routes/points/points.tsx" at "/points"
    route('v2/points', 'routes/points/points.tsx'),

    // Renders "routes/portfolio/portfolio.tsx" at "/portfolio"
    route('v2/portfolio', 'routes/portfolio/portfolio.tsx'),

    // Renders "routes/referrals/referrals.tsx" at "/referrals"
    route('v2/referrals', 'routes/referrals/referrals.tsx'),

    // Renders "routes/more/more.tsx" at "/more"
    route('v2/more', 'routes/more/more.tsx'),

    route('v2/testpage', 'routes/testpage/testpage.tsx'),

    route('v2/subaccounts', 'routes/subaccounts/subaccounts.tsx'),

    route('v2/positions', 'routes/positions/positions.tsx'),

    route('v2/orderHistory/:address?', 'routes/orderHistory/orderHistory.tsx'),

    route('v2/tradeHistory/:address?', 'routes/tradeHistory/tradeHistory.tsx'),

    route('v2/twapHistory/:address?', 'routes/twapHistory/twapHistory.tsx'),

    route('v2/openOrders/:address?', 'routes/openOrders/openOrders.tsx'),

    route(
        'v2/twapFillHistory/:address?',
        'routes/twapFillHistory/twapFillHistory.tsx',
    ),

    route(
        'v2/depositsandwithdrawals/:address?',
        'routes/depositsandwithdrawals/depositsandwithdrawals.tsx',
    ),

    route(
        'v2/fundingHistory/:address?',
        'routes/fundingHistory/fundingHistory.tsx',
    ),
    route('v2/showcase', 'routes/showcase/showcase.tsx'),
    route(
        'v2/showcase/buttons',
        'routes/showcase/buttonShowcase/buttonShowcase.tsx',
    ),
    route(
        'v2/showcase/modals',
        'routes/showcase/modalShowcase/modalShowcase.tsx',
    ),
    route('v2/showcase/tabs', 'routes/showcase/tabShowcase/tabShowcase.tsx'),

    route('*', 'routes/notFound/notFound.tsx'),

    route('v2/terms', 'routes/terms/terms.tsx'),

    route('v2/privacy', 'routes/privacy/privacy.tsx'),
] satisfies RouteConfig;
