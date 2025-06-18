import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // Renders "routes/home/home.tsx" at "/"
    index('routes/home/home.tsx'),

    route('trade/:marketId?', 'routes/trade.tsx'),

    route('strategies', 'routes/strategies/strategies.tsx'),
    route('strategies/new', 'routes/strategies/newStrategy.tsx'),
    route('strategies/:address?', 'routes/strategies/StrategyDetail.tsx'),
    route('strategies/:address/edit', 'routes/strategies/editStrategy.tsx'),

    // Renders "routes/vaults/vaults.tsx" at "/vaults"
    route('vaults', 'routes/vaults/vaultsNew.tsx'),

    route('vaults/:vaultAddress', 'routes/vaults/vaultDetails.tsx'),

    // Renders "routes/leaderboard/leaderboard.tsx" at "/leaderboard"
    route('leaderboard', 'routes/leaderboard/leaderboard.tsx'),

    // Renders "routes/points/points.tsx" at "/points"
    route('points', 'routes/points/points.tsx'),

    // Renders "routes/portfolio/portfolio.tsx" at "/portfolio"
    route('portfolio', 'routes/portfolio/portfolio.tsx'),

    // Renders "routes/referrals/referrals.tsx" at "/referrals"
    route('referrals', 'routes/referrals/referrals.tsx'),

    // Renders "routes/more/more.tsx" at "/more"
    route('more', 'routes/more/more.tsx'),

    route('testpage', 'routes/testpage/testpage.tsx'),

    route('subaccounts', 'routes/subaccounts/subaccounts.tsx'),

    route('positions', 'routes/positions/positions.tsx'),

    route('orderHistory/:address?', 'routes/orderHistory/orderHistory.tsx'),

    route('tradeHistory/:address?', 'routes/tradeHistory/tradeHistory.tsx'),

    route('twapHistory/:address?', 'routes/twapHistory/twapHistory.tsx'),

    route('openOrders/:address?', 'routes/openOrders/openOrders.tsx'),

    route(
        'twapFillHistory/:address?',
        'routes/twapFillHistory/twapFillHistory.tsx',
    ),

    route(
        'fundingHistory/:address?',
        'routes/fundingHistory/fundingHistory.tsx',
    ),
    route('showcase', 'routes/showcase/showcase.tsx'),
    route(
        'showcase/buttons',
        'routes/showcase/buttonShowcase/buttonShowcase.tsx',
    ),
    route('showcase/modals', 'routes/showcase/modalShowcase/modalShowcase.tsx'),
    route('showcase/tabs', 'routes/showcase/tabShowcase/tabShowcase.tsx'),

    route('*', 'routes/notFound/notFound.tsx'),
] satisfies RouteConfig;
