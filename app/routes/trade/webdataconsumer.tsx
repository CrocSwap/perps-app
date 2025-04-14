import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWsObserver, WsChannels } from '~/hooks/useWsObserver';
import { processUserOrder } from '~/processors/processOrderBook';
import { processSymbolInfo } from '~/processors/processSymbolInfo';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/position/PositionIFs';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';

export default function WebDataConsumer() {
    const {
        favKeys,
        setFavCoins,
        setUserOrders,
        symbol,
        setCoins,
        coins,
        setPositions,
        positions,
        setCoinPriceMap,
    } = useTradeDataStore();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;
    const favKeysRef = useRef<string[]>(null);
    favKeysRef.current = favKeys;

    const { subscribe, unsubscribeAllByChannel } = useWsObserver();
    const { debugWallet } = useDebugStore();
    const addressRef = useRef<string>(null);
    addressRef.current = debugWallet.address.toLowerCase();
    const { setSymbolInfo } = useTradeDataStore();

    const openOrdersRef = useRef<OrderDataIF[]>([]);
    const positionsRef = useRef<PositionIF[]>([]);

    useEffect(() => {
        const foundCoin = coins.find((coin) => coin.coin === symbol);
        if (foundCoin) {
            setSymbolInfo(foundCoin);
        }
    }, [symbol, coins]);

    useEffect(() => {
        setUserOrders([]);
        openOrdersRef.current = [];

        subscribe(WsChannels.WEB_DATA2, {
            payload: { user: debugWallet.address },
            handler: (payload) => {
                setCoins(payload.data.coins);
                setCoinPriceMap(payload.data.coinPriceMap);
                if (payload.data.user.toLowerCase() === addressRef.current) {
                    openOrdersRef.current = payload.data.userOpenOrders;
                    positionsRef.current = payload.data.positions;
                }
            },
            single: true,
        });

        const openOrdersInterval = setInterval(() => {
            setUserOrders(openOrdersRef.current);
        }, 1000);

        const positionsInterval = setInterval(() => {
            setPositions(positionsRef.current);
        }, 1000);

        return () => {
            clearInterval(openOrdersInterval);
            clearInterval(positionsInterval);
            unsubscribeAllByChannel(WsChannels.WEB_DATA2);
        };
    }, [debugWallet.address]);

    useEffect(() => {
        if (favKeysRef.current && coins.length > 0) {
            const favs: SymbolInfoIF[] = [];
            favKeysRef.current.forEach((coin) => {
                const c = coins.find((c) => c.coin === coin);
                if (c) {
                    favs.push(c);
                }
            });
            setFavCoins(favs);
        }
    }, [favKeys, coins]);

    return <></>;
}
