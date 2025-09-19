import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getLS, processSymbolUrlParam } from '~/utils/AppUtils';
import {
    getPollingApiUrl,
    POLLING_API_INFO_ENDPOINT,
    WsChannels,
} from '~/utils/Constants';

export default function TradeRouteHandler() {
    const { marketId } = useParams<{ marketId: string }>(); // Get marketId from URL

    const { setSymbol } = useTradeDataStore();
    const navigate = useNavigate();

    const getSymbolFromLS = () => {
        const activeSymbol = getLS('activeCoin');
        if (activeSymbol) {
            setSymbol(activeSymbol);
        } else {
            setSymbol('BTC');
        }
    };

    const checkSymbol = async () => {
        let urlSymbol = marketId;

        if (urlSymbol === undefined || urlSymbol === null || urlSymbol === '') {
            return getSymbolFromLS();
        } else {
            urlSymbol = processSymbolUrlParam(urlSymbol);

            const reqPayload = {
                type: WsChannels.ORDERBOOK,
                coin: urlSymbol,
            };

            const targetServer = getPollingApiUrl(reqPayload);

            const response = await fetch(`${targetServer}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqPayload),
            });

            const data = await response.json();
            if (data && data.levels) {
                setSymbol(urlSymbol);
            } else {
                setSymbol('BTC');
                navigate('/v2/trade/BTC', { viewTransition: true });
            }
        }
    };

    useEffect(() => {
        checkSymbol();
    }, [marketId]);

    return <></>;
}
