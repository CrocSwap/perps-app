import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ApiEndpoints, useInfoApi } from '~/hooks/useInfoApi';
import { useSdk } from '~/hooks/useSdk';
import { processUserOrder } from '~/processors/processOrderBook';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { OrderHistoryLimits, WsChannels } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import styles from './OrderHistoryTable.module.css';
import OrderHistoryTableHeader from './OrderHistoryTableHeader';
import OrderHistoryTableRow from './OrderHistoryTableRow';
import { orderHistoryData } from './data';

interface OrderHistoryTableProps {
    onViewAll?: () => void;
    selectedFilter: string;
}

export default function OrderHistoryTable(props: OrderHistoryTableProps) {
    const { onViewAll, selectedFilter } = props;

    const { orderHistory } = useTradeDataStore();

    const { info } = useSdk();
    const { addOrderToHistory, symbol, setOrderHistory, filterOrderHistory } =
        useTradeDataStore();

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const { fetchData } = useInfoApi();

    const userOrderHistoryRef = useRef<OrderDataIF[]>([]);

    const saveToStoreLock = useRef<boolean>(false);

    const { isWsEnabled } = useDebugStore();
    const isWsEnabledRef = useRef<boolean>(true);
    isWsEnabledRef.current = isWsEnabled;

    useEffect(() => {
        const saveIntoStoreInterval = setInterval(() => {
            if (!isWsEnabledRef.current) {
                return;
            }
            if (saveToStoreLock.current) {
                return;
            }
            addOrderToHistory(userOrderHistoryRef.current);
        }, 1000);

        return () => {
            clearInterval(saveIntoStoreInterval);
        };
    }, []);

    useEffect(() => {
        setOrderHistory([]);

        fetchData({
            type: ApiEndpoints.HISTORICAL_ORDERS,
            payload: { user: debugWallet.address },
            handler: (data) => {
                if (!isWsEnabledRef.current) {
                    return;
                }
                if (data && data.length > 0) {
                    const orders: OrderDataIF[] = [];
                    data.slice(0, OrderHistoryLimits.MAX).map((o: any) => {
                        const processedOrder = processUserOrder(
                            o.order,
                            o.status,
                        );
                        if (processedOrder) {
                            orders.push(processedOrder);
                        }
                    });
                    setOrderHistory(orders);
                }
            },
        });
    }, [debugWallet.address]);

    const orderHistoryToShow = useMemo(() => {
        return filterOrderHistory(orderHistory, selectedFilter);
    }, [orderHistory, selectedFilter, symbol]);

    useEffect(() => {
        if (!info) return;
        if (!debugWallet.address) return;

        const { unsubscribe } = info.subscribe(
            {
                type: WsChannels.USER_HISTORICAL_ORDERS,
                user: debugWallet.address,
            },
            postUserHistoricalOrders,
        );

        return unsubscribe;
    }, [debugWallet.address, info]);

    const postUserHistoricalOrders = useCallback((payload: any) => {
        const data = payload.data;
        if (data && data.orderHistory && data.orderHistory.length > 0) {
            if (data.user !== currentUserRef.current) {
                saveToStoreLock.current = true;
            } else {
                const orderUpdates: OrderDataIF[] = [];
                data.orderHistory.map((o: any) => {
                    const processedOrder = processUserOrder(o.order, o.status);
                    if (processedOrder) {
                        orderUpdates.push(processedOrder);
                    }
                });
                if (!data.isSnapshot) {
                    userOrderHistoryRef.current = [
                        ...orderUpdates,
                        ...userOrderHistoryRef.current,
                    ];
                    userOrderHistoryRef.current.sort(
                        (a, b) => b.timestamp - a.timestamp,
                    );
                }
                saveToStoreLock.current = false;
            }
        }
    }, []);

    const handleViewAll = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onViewAll) {
            onViewAll();
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <OrderHistoryTableHeader />
            <div className={styles.tableBody}>
                {orderHistoryToShow.map((order, index) => (
                    <OrderHistoryTableRow
                        key={`order-${index}`}
                        order={order}
                    />
                ))}

                {orderHistoryData.length === 0 && (
                    <div
                        className={styles.rowContainer}
                        style={{ justifyContent: 'center', padding: '2rem 0' }}
                    >
                        No order history
                    </div>
                )}

                {orderHistoryData.length > 0 && (
                    <a
                        href='#'
                        className={styles.viewAllLink}
                        onClick={handleViewAll}
                    >
                        View All
                    </a>
                )}
            </div>
        </div>
    );
}
