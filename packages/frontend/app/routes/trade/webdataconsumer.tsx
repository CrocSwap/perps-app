import { useCallback, useEffect, useRef } from 'react';
import { useInfoApi } from '~/hooks/useInfoApi';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useSdk } from '~/hooks/useSdk';
import { useWorker } from '~/hooks/useWorker';
import type { WebData2Output } from '~/hooks/workers/webdata2.worker';
import { processUserOrder } from '~/processors/processOrderBook';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { WsChannels } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/position/PositionIFs';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import type { AccountOverviewIF, UserBalanceIF } from '~/utils/UserDataIFs';

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
        setUserBalances,
        userBalances,
        setCoinPriceMap,
        setAccountOverview,
        accountOverview,
        setWebDataFetched,
        setOrderHistoryFetched,
        setOrderHistory,
    } = useTradeDataStore();
    const symbolRef = useRef<string>(symbol);
    symbolRef.current = symbol;
    const favKeysRef = useRef<string[]>(null);
    favKeysRef.current = favKeys;

    const { debugWallet } = useDebugStore();
    const addressRef = useRef<string>(null);
    addressRef.current = debugWallet.address.toLowerCase();
    const { setSymbolInfo } = useTradeDataStore();

    const openOrdersRef = useRef<OrderDataIF[]>([]);
    const positionsRef = useRef<PositionIF[]>([]);
    const userBalancesRef = useRef<UserBalanceIF[]>([]);
    const userOrderHistoryRef = useRef<OrderDataIF[]>([]);

    const { info } = useSdk();
    const accountOverviewRef = useRef<AccountOverviewIF | null>(null);

    const acccountOverviewPrevRef = useRef<AccountOverviewIF | null>(null);
    const webDataFetchedRef = useRef<boolean>(false);
    const orderHistoryFetchedRef = useRef<boolean>(false);

    const { fetchOrderHistory } = useInfoApi();

    useEffect(() => {
        const foundCoin = coins.find((coin) => coin.coin === symbol);
        if (foundCoin) {
            setSymbolInfo(foundCoin);
        }
    }, [symbol, coins]);

    useEffect(() => {
        if (!info) return;
        webDataFetchedRef.current = false;
        orderHistoryFetchedRef.current = false;
        setWebDataFetched(false);
        setOrderHistoryFetched(false);

        const { unsubscribe } = info.subscribe(
            { type: WsChannels.WEB_DATA2, user: debugWallet.address },
            postWebData2,
        );

        const { unsubscribe: unsubscribeOrderHistory } = info.subscribe(
            {
                type: WsChannels.USER_HISTORICAL_ORDERS,
                user: debugWallet.address,
            },
            postUserHistoricalOrders,
        );

        const userDataInterval = setInterval(() => {
            setUserOrders(openOrdersRef.current);
            setPositions(positionsRef.current);
            setUserBalances(userBalancesRef.current);
            setOrderHistory(userOrderHistoryRef.current);
            if (acccountOverviewPrevRef.current && accountOverviewRef.current) {
                accountOverviewRef.current.balanceChange =
                    accountOverviewRef.current.balance -
                    acccountOverviewPrevRef.current.balance;
                accountOverviewRef.current.maintainanceMarginChange =
                    accountOverviewRef.current.maintainanceMargin -
                    acccountOverviewPrevRef.current.maintainanceMargin;
            }
            if (accountOverviewRef.current) {
                setAccountOverview(accountOverviewRef.current);
            }
            if (webDataFetchedRef.current) {
                setWebDataFetched(true);
            } else {
                setWebDataFetched(false);
            }
            if (orderHistoryFetchedRef.current) {
                setOrderHistoryFetched(true);
            } else {
                setOrderHistoryFetched(false);
            }
        }, 1000);

        return () => {
            clearInterval(userDataInterval);
            unsubscribe();
            unsubscribeOrderHistory();
        };
    }, [debugWallet.address, info]);

    useEffect(() => {
        acccountOverviewPrevRef.current = accountOverview;
    }, [accountOverview]);

    const handleWebData2WorkerResult = useCallback(
        ({ data }: { data: WebData2Output }) => {
            setCoins(data.data.coins);
            setCoinPriceMap(data.data.coinPriceMap);
            if (data.data.user.toLowerCase() === addressRef.current) {
                openOrdersRef.current = data.data.userOpenOrders;
                positionsRef.current = data.data.positions;
                userBalancesRef.current = data.data.userBalances;
                accountOverviewRef.current = data.data.accountOverview;
            }
            webDataFetchedRef.current = true;
        },
        [setCoins, setCoinPriceMap],
    );

    const postWebData2 = useWorker<WebData2Output>(
        'webData2',
        handleWebData2WorkerResult,
    );

    const postUserHistoricalOrders = useCallback((payload: any) => {
        const data = payload.data;
        if (
            data &&
            data.orderHistory &&
            data.orderHistory.length > 0 &&
            data.user &&
            data.user.toLowerCase() === addressRef.current?.toLocaleLowerCase()
        ) {
            const orders: OrderDataIF[] = [];
            data.orderHistory.forEach((order: any) => {
                const processedOrder = processUserOrder(
                    order.order,
                    order.status,
                );
                if (processedOrder) {
                    orders.push(processedOrder);
                }
            });
            if (data.isSnapshot) {
                orders.sort((a, b) => b.timestamp - a.timestamp);
                userOrderHistoryRef.current = orders;
            } else {
                userOrderHistoryRef.current = [
                    ...orders.sort((a, b) => b.timestamp - a.timestamp),
                    ...userOrderHistoryRef.current,
                ];
                userOrderHistoryRef.current.sort(
                    (a, b) => b.timestamp - a.timestamp,
                );
            }
            orderHistoryFetchedRef.current = true;
        }
    }, []);

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
