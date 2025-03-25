import { useEffect } from 'react';
import { useParams } from 'react-router';
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
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import { useDebugStore } from '~/stores/DebugStore';
import { debugWallets, wsUrls } from '~/utils/Constants';
import { getLS } from '~/utils/AppUtils';
import { useWsObserver } from '~/hooks/useWsObserver';
import TradeRouteHandler from './trade/traderoutehandler';
import TradeModules from './trade/trademodules/trademodules';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import OrderInput from '~/components/Trade/OrderInput/OrderInput';
import Notifications from '~/components/Notifications/Notifications';
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

  const {symbol} = useTradeDataStore();
  const { orderBookMode } = useAppSettings();


  const { wsUrl, setWsUrl, debugWallet, setDebugWallet } = useDebugStore();


    
  
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
<>
<div className={styles.wsUrlSelector}>
<ComboBox
  value={wsUrl}
  options={wsUrls}
  onChange={(value) => setWsUrl(value)}
/>
</div>
<div className={styles.walletSelector}>
<ComboBox
  value={debugWallet.label}
  options={debugWallets}
  fieldName='label'
  onChange={(value) => setDebugWallet({label: value, address: debugWallets.find((wallet) => wallet.label === value)?.address || ''})}
/>
</div>
    
      <TradeRouteHandler />
      {
        symbol && symbol.length > 0 && (

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
              <div className={styles.tradeModules}><OrderInput/></div>
            </section>
            <section className={styles.containerBottom}>
                <div className={styles.table}>
                    <TradeTable/>
                </div>
                <div className={styles.wallet}>
                    <DepositDropdown
                        isUserConnected={false}
                        setIsUserConnected={() => console.log('connected')}
                    />
                </div>
             </section>
   
    </div>
          
        )
      }
    </>
  );
}
