import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import OrderHistoryTable from '~/components/Trade/OrderHistoryTable/OrderHistoryTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type { Route } from '../../+types/root';
import WebDataConsumer from '../trade/webdataconsumer';
import styles from './orderHistory.module.css';
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Perps - Positions' },
        { name: 'description', content: 'Welcome to React Router!' },
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}

function OrderHistory({ loaderData }: Route.ComponentProps) {
    const { address } = useParams<{ address: string }>();

    const [isFetched, setIsFetched] = useState(false);

    const { debugWallet } = useDebugStore();

    const { orderHistory, orderHistoryFetched } = useTradeDataStore();

    const [fetchedHistoryData, setFetchedHistoryData] = useState<OrderDataIF[]>(
        [],
    );

    const { fetchOrderHistory } = useInfoApi();

    const isCurrentUser = useMemo(() => {
        if (address) {
            return (
                address.toLocaleLowerCase() ===
                debugWallet.address.toLocaleLowerCase()
            );
        } else {
            return true;
        }
    }, [address, debugWallet.address]);

    useEffect(() => {
        if (!isCurrentUser && address) {
            fetchOrderHistory(address).then((data) => {
                setFetchedHistoryData(data);
                setIsFetched(true);
            });
        } else if (orderHistoryFetched) {
            setIsFetched(true);
        }
    }, [isCurrentUser, address, orderHistoryFetched]);

    const tableData = useMemo(() => {
        if (isCurrentUser) {
            return orderHistory;
        } else {
            return fetchedHistoryData;
        }
    }, [isCurrentUser, orderHistory, fetchedHistoryData]);

    const isFullScreen = true;

    // Memoize the container class name
    const containerClassName = useMemo(() => {
        return `${styles.container} ${isFullScreen ? styles.fullScreen : ''}`;
    }, [isFullScreen]);

    return (
        <div className={containerClassName}>
            {isCurrentUser && <WebDataConsumer />}
            <header>Order History</header>

            <div className={styles.content}>
                <OrderHistoryTable
                    data={tableData}
                    isFetched={isFetched}
                    pageMode={true}
                />
            </div>
        </div>
    );
}
export default OrderHistory;
