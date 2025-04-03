import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { Route } from '../+types/root';
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'TRADE' },
        { name: 'description', content: 'Welcome to React Router!' },
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}

// const wsUrl = 'wss://api.hyperliquid.xyz/ws';
// const wsUrl = 'wss://pulse-api-mock.liquidity.tools/ws';

export default function Trade({ loaderData }: Route.ComponentProps) {
    console.log('running trade');
    const { symbol } = useTradeDataStore();
    const { orderBookMode } = useAppSettings();

    // const {
    //     wsUrl,
    //     setWsUrl,
    //     debugWallet,
    //     setDebugWallet,
    //     isWsEnabled,
    //     setIsWsEnabled,
    // } = useDebugStore();

    // const nav = (
    //      {/* Example nav links to each child route */}
    //   <nav style={{ marginBottom: '1rem' }}>
    //   <Link to='market' style={{ marginRight: '1rem' }}>
    //     Market
    //   </Link>
    //   <Link to='limit' style={{ marginRight: '1rem' }}>
    //     Limit
    //   </Link>
    //   <Link to='pro' style={{ marginRight: '1rem' }}>
    //     Pro
    //   </Link>
    // </nav>

    // )

    console.log({ symbol });

    return (
        <div>
            <h1>Trade</h1>
            <p>Placeholder.</p>
        </div>
    );
}
