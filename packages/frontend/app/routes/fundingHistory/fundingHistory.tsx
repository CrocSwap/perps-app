import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import ExternalPage from '~/components/ExternalPage/ExternalPage';
import FundingHistoryTable from '~/components/Trade/FundingHistoryTable/FundingHistoryTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import type { UserFundingIF } from '~/utils/UserDataIFs';

function FundingHistory() {
    const { address } = useParams<{ address: string }>();

    const walletAddress = useDebugStore((s) => s.debugWallet.address);

    const targetAddress = address ?? walletAddress;

    const [isFetched, setIsFetched] = useState(false);

    const [loading, setLoading] = useState(false);

    const [fetchedHistoryData, setFetchedHistoryData] = useState<
        UserFundingIF[]
    >([]);

    const { fetchFundingHistory } = useInfoApi();

    useEffect(() => {
        if (!targetAddress) return;
        setLoading(true);
        fetchFundingHistory(targetAddress)
            .then((data) => {
                setFetchedHistoryData(data);
                setIsFetched(true);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [targetAddress]);

    return (
        <ExternalPage title='Funding History'>
            <FundingHistoryTable
                userFundings={fetchedHistoryData}
                isFetched={isFetched}
                pageMode={true}
            />
        </ExternalPage>
    );
}
export default FundingHistory;
