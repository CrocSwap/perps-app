import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import HistoryTwapTable from '~/components/Trade/TwapTable/HistoryTwapTable/HistoryTwapTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import type { TwapHistoryIF } from '~/utils/UserDataIFs';
import ExternalPage from '~/components/ExternalPage/ExternalPage';

function TwapHistory() {
    const { address } = useParams<{ address: string }>();

    const [isFetched, setIsFetched] = useState(false);

    const [fetchedHistoryData, setFetchedHistoryData] = useState<
        TwapHistoryIF[]
    >([]);

    const { fetchTwapHistory } = useInfoApi();

    useEffect(() => {
        if (address) {
            fetchTwapHistory(address).then((data) => {
                setFetchedHistoryData(data);
                setIsFetched(true);
            });
        }
    }, [address]);

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
