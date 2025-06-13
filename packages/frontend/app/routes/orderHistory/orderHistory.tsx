import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import ExternalPage from '~/components/ExternalPage/ExternalPage';
import OrderHistoryTable from '~/components/Trade/OrderHistoryTable/OrderHistoryTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { WsChannels } from '~/utils/Constants';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';

interface propsIF {
    maxTableHeight?: string;
}

function OrderHistory(props: propsIF) {
    const { maxTableHeight } = props;
    console.log(maxTableHeight);
    const { address } = useParams<{ address: string }>();

    const [isFetched, setIsFetched] = useState(false);

    const { debugWallet } = useDebugStore();

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
        //         debugWallet.address.toLocaleLowerCase()
        //     );
        // } else {
        //     return true;
        // }
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
    console.log(maxTableHeight);
    return (
        <ExternalPage title='Order History'>
            <OrderHistoryTable
                maxTableHeight={maxTableHeight}
                data={tableData}
                isFetched={isFetched}
                pageMode={true}
            />
        </ExternalPage>
    );
}
export default OrderHistory;
