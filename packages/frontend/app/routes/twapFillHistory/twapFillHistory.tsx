import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import ExternalPage from '~/components/ExternalPage/ExternalPage';
import FillTwapTable from '~/components/Trade/TwapTable/FillTwapTable/FillTwapTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import type { TwapSliceFillIF } from '~/utils/UserDataIFs';

function TwapFillHistory() {
    const { address } = useParams<{ address: string }>();

    const walletAddress = useDebugStore((s) => s.debugWallet.address);

    const targetAddress = address ?? walletAddress;

    const [isFetched, setIsFetched] = useState(false);

    const [loading, setLoading] = useState(false);

    const [fetchedHistoryData, setFetchedHistoryData] = useState<
        TwapSliceFillIF[]
    >([]);

    const { fetchTwapSliceFills } = useInfoApi();

    useEffect(() => {
        if (!targetAddress) return;
        setLoading(true);
        fetchTwapSliceFills(targetAddress)
            .then((data) => {
                setFetchedHistoryData(data);
                setIsFetched(true);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [targetAddress]);

    return (
        <ExternalPage title='TWAP Fill History'>
            <FillTwapTable
                data={fetchedHistoryData}
                isFetched={isFetched}
                pageMode={true}
            />
        </ExternalPage>
    );
}
export default TwapFillHistory;
