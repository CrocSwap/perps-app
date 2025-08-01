import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { WsChannels } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import ExternalPage from '../ExternalPage/ExternalPage';
import OrderHistoryTable from '../Trade/OrderHistoryTable/OrderHistoryTable';

interface propsIF {
    pageMode: boolean;
}

function OrderHistory(props: propsIF) {
    const { pageMode } = props;

    const { address } = useParams<{ address: string }>();

    const [isFetched, setIsFetched] = useState(false);

    const { userAddress } = useUserDataStore();

    const { orderHistory, fetchedChannels } = useTradeDataStore();

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
        //         userAddress.toLocaleLowerCase()
        //     );
        // } else {
        //     return true;
        // }
    }, [address, userAddress]);

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
                pageMode={pageMode}
            />
        </ExternalPage>
    );
}
export default OrderHistory;
