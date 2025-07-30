import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import HistoryTwapTable from '~/components/Trade/TwapTable/HistoryTwapTable/HistoryTwapTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import type { TwapHistoryIF } from '~/utils/UserDataIFs';
import ExternalPage from '~/components/ExternalPage/ExternalPage';
import { useDebugStore } from '~/stores/DebugStore';

function TwapHistory() {
    const { address } = useParams<{ address: string }>();

    const walletAddress = useDebugStore((s) => s.debugWallet.address);

    const targetAddress = address ?? walletAddress;

    const [isFetched, setIsFetched] = useState(false);

    const [loading, setLoading] = useState(false);

    const [fetchedHistoryData, setFetchedHistoryData] = useState<
        TwapHistoryIF[]
    >([]);

    const { fetchTwapHistory } = useInfoApi();

    useEffect(() => {
        if (!targetAddress) return;
        setLoading(true);
        fetchTwapHistory(targetAddress)
            .then((data) => {
                setFetchedHistoryData(data);
                setIsFetched(true);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [targetAddress]);

    return (
        <ExternalPage title='TWAP History'>
            <HistoryTwapTable
                data={fetchedHistoryData}
                isFetched={isFetched}
                pageMode={true}
            />
        </ExternalPage>
    );
}
export default TwapHistory;
