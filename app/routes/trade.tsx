import { WebSocketProvider } from '~/contexts/WebSocketContext';
import type { Route } from '../+types/root';
import styles from './trade.module.css';
import DepositDropdown from '~/components/PageHeader/DepositDropdown/DepositDropdown';
import OrderBook from './trade/orderbook/orderbook';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import SymbolInfo from './trade/symbol/symbolinfo';
import OrderBookSection from './trade/orderbook/orderbooksection';
import TradingViewChart from './chart/chart';
import TradingViewWrapper from '~/components/Tradingview/TradingviewWrapper';
import { useAppSettings } from '~/stores/AppSettingsStore';
import WatchList from './trade/watchlist/watchlist';
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'TRADE' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_NETLIFY };
}

const wsUrl = 'wss://api.hyperliquid.xyz/ws';
// const wsUrl = 'wss://pulse-api-mock.liquidity.tools/ws';

export default function Trade({ loaderData }: Route.ComponentProps) {

  const {symbol} = useTradeDataStore();
  const { orderBookMode } = useAppSettings();
  
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
  return (
    <WebSocketProvider url={wsUrl}>
    <div className={styles.container}>
      <section className={`${styles.containerTop} ${orderBookMode === 'large' ? styles.orderBookLarge : ''}`}>
        <div className={styles.containerTopLeft}>
          <div className={styles.watchlist}><WatchList/></div>
          <div className={styles.symbolInfo}>

            <SymbolInfo />


          </div>
          <div id='chartSection' className={styles.chart}><TradingViewWrapper /></div>
        </div>

        <div id='orderBookSection' className={styles.orderBook}><OrderBookSection symbol={symbol} /></div>

        <div className={styles.tradeModules}></div>
      </section>
      <section className={styles.containerBottom}>
        <div className={styles.table}>table</div>
        <div className={styles.wallet}>
          <DepositDropdown
            isUserConnected={false}
            setIsUserConnected={() => console.log('connected')}
          />
        </div>
      </section>
      {/* Child routes (market, limit, pro) appear here */}
      {/* <Outlet /> */}
    </div>
    </WebSocketProvider>
  );
}
