import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // Renders "routes/home/home.tsx" at "/"
    index('routes/home/home.tsx'),

    route('trade/:marketId?', 'routes/trade.tsx'),

    // Renders "routes/vaults/vaults.tsx" at "/vaults"
    route('vaults', 'routes/vaults/vaults.tsx'),

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
] satisfies RouteConfig;
