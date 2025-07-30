import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import ExternalPage from '~/components/ExternalPage/ExternalPage';
import OpenOrdersTable from '~/components/Trade/OpenOrdersTable/OpenOrdersTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';

function OpenOrders() {
    const { address } = useParams<{ address: string }>();

    const walletAddress = useDebugStore((s) => s.debugWallet.address);

    const targetAddress = address ?? walletAddress;

    const [isFetched, setIsFetched] = useState(false);

    const [loading, setLoading] = useState(false);

    const [fetchedData, setFetchedData] = useState<OrderDataIF[]>([]);

    const { fetchOpenOrders } = useInfoApi();

    useEffect(() => {
        if (!targetAddress) return;
        setLoading(true);
        fetchOpenOrders(targetAddress)
            .then((data) => {
                setFetchedData(data);
                setIsFetched(true);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [targetAddress]);

    return (
        <ExternalPage title='Open Orders'>
            <OpenOrdersTable
                data={fetchedData}
                isFetched={isFetched}
                pageMode={true}
            />
        </ExternalPage>
    );
}
export default OpenOrders;
