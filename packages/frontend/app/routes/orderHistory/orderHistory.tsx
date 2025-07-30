import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import ExternalPage from '~/components/ExternalPage/ExternalPage';
import OrderHistoryTable from '~/components/Trade/OrderHistoryTable/OrderHistoryTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { WsChannels } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';

function OrderHistory() {
    const { address } = useParams<{ address: string }>();

    const walletAddress = useDebugStore((s) => s.debugWallet.address);

    const targetAddress = address ?? walletAddress;

    const [isFetched, setIsFetched] = useState(false);

    const { debugWallet } = useDebugStore();

    const { orderHistory, fetchedChannels } = useTradeDataStore();

    const [loading, setLoading] = useState(false);

    const orderHistoryFetched = useMemo(() => {
        return fetchedChannels.has(WsChannels.USER_HISTORICAL_ORDERS);
    }, [fetchedChannels]);

    const [fetchedHistoryData, setFetchedHistoryData] = useState<OrderDataIF[]>(
        [],
    );

    const { fetchOrderHistory } = useInfoApi();

    // TODO: live update is disabled for now, because websocket snapshots were sending limited data
    const isCurrentUser = useMemo(() => {
        return false;
        // if (address) {
        //     return (
        //         address.toLocaleLowerCase() ===
        //         debugWallet.address.toLocaleLowerCase()
        //     );
        // } else {
        //     return true;
        // }
    }, [address, debugWallet.address]);

    useEffect(() => {
        if (!targetAddress) return;
        setLoading(true);
        fetchOrderHistory(targetAddress)
            .then((data) => {
                setFetchedHistoryData(data);
                setIsFetched(true);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [targetAddress]);

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

    return (
        <ExternalPage title='Order History'>
            <OrderHistoryTable
                data={tableData}
                isFetched={isFetched}
                pageMode={true}
            />
        </ExternalPage>
    );
}
export default OrderHistory;
