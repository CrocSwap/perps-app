'use client';

import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import DepositDropdown from '~/components/PageHeader/DepositDropdown/DepositDropdown';
import OrderInput from '~/components/Trade/OrderInput/OrderInput';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import TradingViewWrapper from '~/components/Tradingview/TradingviewWrapper';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { debugWallets, wsUrls } from '~/utils/Constants';
import type { Route } from '../+types/root';
import styles from './trade.module.css';
import OrderBookSection from './trade/orderbook/orderbooksection';
import SymbolInfo from './trade/symbol/symbolinfo';
import TradeRouteHandler from './trade/traderoutehandler';
import WatchList from './trade/watchlist/watchlist';
import { useRef } from 'react';
import WebDataConsumer from './trade/webdataconsumer';
// eslint-disable-next-line no-empty-pattern
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

export default function Trade() {
// { loaderData }: Route.ComponentProps
    const { symbol } = useTradeDataStore();
    const symbolRef = useRef(symbol);
    symbolRef.current = symbol;
    const { orderBookMode } = useAppSettings();

    const {
        wsUrl,
        setWsUrl,
        debugWallet,
        setDebugWallet,
        isWsEnabled,
        setIsWsEnabled,
    } = useDebugStore();

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
                    onChange={(value) =>
                        setDebugWallet({
                            label: value,
                            address:
                                debugWallets.find(
                                    (wallet) => wallet.label === value,
                                )?.address || '',
                        })
                    }
                />
            </div>

            <div
                className={`${styles.wsToggle} ${isWsEnabled ? styles.wsToggleRunning : styles.wsTogglePaused}`}
                onClick={() => setIsWsEnabled(!isWsEnabled)}
            >
                <div className={styles.wsToggleButton}>
                    {' '}
                    {isWsEnabled ? 'WS Running' : 'Paused'}
                </div>
            </div>

            <TradeRouteHandler />
            <WebDataConsumer />
            {symbol && symbol.length > 0 && (
                <div className={styles.container}>
                    <section
                        className={`${styles.containerTop} ${orderBookMode === 'large' ? styles.orderBookLarge : ''}`}
                    >
                        <div
                            className={`${styles.containerTopLeft} ${styles.symbolSectionWrapper}`}
                        >
                            <div
                                id='watchlistSection'
                                className={styles.watchlist}
                            >
                                <WatchList />
                            </div>
                            <div
                                id='symbolInfoSection'
                                className={styles.symbolInfo}
                            >
                                <SymbolInfo />
                            </div>
                            <div id='chartSection' className={styles.chart}>
                                <TradingViewWrapper />
                            </div>
                        </div>

                        <div id='orderBookSection' className={styles.orderBook}>
                            <OrderBookSection symbol={symbol} />
                        </div>
                        <div
                            id='tradeModulesSection'
                            className={styles.tradeModules}
                        >
                            <OrderInput />
                        </div>
                    </section>
                    <section
                        id={'bottomSection'}
                        className={styles.containerBottom}
                    >
                        <div className={styles.table}>
                            <TradeTable />
                        </div>
                        <div className={styles.wallet}>
                            <DepositDropdown
                                isUserConnected={false}
                                setIsUserConnected={() =>
                                    console.log('connected')
                                }
                            />
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
