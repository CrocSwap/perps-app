import { useEffect, useRef, useState } from 'react';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useDebugStore } from '~/stores/DebugStore';
import NoConnectionIndicator from '../NoConnectionIndicator/NoConnectionIndicator';
import WsReconnectingIndicator from '../WsReconnectingIndicator/WsReconnectingIndicator';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useNumFormatter } from '~/hooks/useNumFormatter';
import { WS_SLEEP_MODE, WS_SLEEP_MODE_PRICE_CHECK } from '~/utils/Constants';

export default function WsConnectionChecker() {
    // Use memoized value to prevent unnecessary re-renders
    const { setIsWsSleepMode, isWsSleepMode } = useDebugStore();
    const sleepModeTimeout = useRef<NodeJS.Timeout | null>(null);
    const { setInternetConnected, internetConnected, wsReconnecting } =
        useAppStateStore();

    const titleSetterIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [tokenId, setTokenId] = useState<string>('');

    const { fetchTokenId, fetchTokenDetails } = useInfoApi();

    const { symbol } = useTradeDataStore();
    const { setTitleOverride, setIsTabActive } = useAppStateStore();
    const { formatNum } = useNumFormatter();
    const isTabPassive = useRef(false);

    useEffect(() => {
        const onlineListener = () => {
            setInternetConnected(true);
        };
        const offlineListener = () => {
            setInternetConnected(false);
        };
        const visibilityListener = () => {
            if (document.visibilityState === 'hidden') {
                isTabPassive.current = true;
                if (sleepModeTimeout.current) {
                    clearTimeout(sleepModeTimeout.current);
                }
                sleepModeTimeout.current = setTimeout(() => {
                    if (isTabPassive.current) {
                        console.log('>>> sleep mode', new Date().toISOString());
                        setIsWsSleepMode(true);
                        setIsTabActive(false);
                    }
                }, WS_SLEEP_MODE);
            } else {
                console.log('>>> resume mode', new Date().toISOString());
                isTabPassive.current = false;
                if (sleepModeTimeout.current) {
                    clearTimeout(sleepModeTimeout.current);
                }
                setIsWsSleepMode(false);
                setIsTabActive(true);
            }
        };

        window.addEventListener('online', onlineListener);
        window.addEventListener('offline', offlineListener);
        window.addEventListener('visibilitychange', visibilityListener);

        return () => {
            window.removeEventListener('online', onlineListener);
            window.removeEventListener('offline', offlineListener);
            window.removeEventListener('visibilitychange', visibilityListener);
            if (sleepModeTimeout.current) {
                clearTimeout(sleepModeTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        if (symbol && isWsSleepMode) {
            const fetcher = async () => {
                const tokenId = await fetchTokenId(symbol);
                setTokenId(tokenId);
            };
            fetcher();

            titleSetterIntervalRef.current = setInterval(async () => {
                if (tokenId) {
                    const tokenDetails = await fetchTokenDetails(tokenId);
                    setTitleOverride(
                        `${tokenDetails.markPx ? '$' + formatNum(tokenDetails.markPx) + ' | ' : ''} ${symbol?.toUpperCase() ? symbol?.toUpperCase() + ' | ' : ''}Ambient`,
                    );
                }
            }, WS_SLEEP_MODE_PRICE_CHECK);
        } else {
            if (titleSetterIntervalRef.current) {
                clearInterval(titleSetterIntervalRef.current);
            }
            setTitleOverride('');
        }

        return () => {
            if (titleSetterIntervalRef.current) {
                clearInterval(titleSetterIntervalRef.current);
            }
        };
    }, [isWsSleepMode, symbol, tokenId]);

    return (
        <>
            {!internetConnected && <NoConnectionIndicator />}
            {wsReconnecting && <WsReconnectingIndicator />}
        </>
    );
}
('');
