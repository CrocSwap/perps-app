import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getLS } from '~/utils/AppUtils';
import { WsChannels } from '~/utils/Constants';

export default function TradeRouteHandler() {
    const { marketId } = useParams<{ marketId: string }>(); // Get marketId from URL

    const { symbol, setSymbol } = useTradeDataStore();
    const navigate = useNavigate();

    useEffect(() => {
        const activeSymbol = getLS('activeCoin');
        if (activeSymbol) {
            setSymbol(activeSymbol);
        } else {
            setSymbol('BTC');
        }
    }, []);

    const checkSymbol = async () => {
        const urlSymbol = marketId;

        if (urlSymbol && urlSymbol.length > 0 && urlSymbol !== symbol) {
            const response = await fetch(`https://api.hyperliquid.xyz/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: WsChannels.ORDERBOOK,
                    coin: urlSymbol,
                }),
            });

            if (response && response.ok) {
                setSymbol(urlSymbol);
            } else {
                navigate('/trade/BTC');
            }
        }
    };

    useEffect(() => {
        checkSymbol();
        marketId && console.log(marketId); // Logs the ticker from the URL
    }, [marketId]);

    return <></>;
}
