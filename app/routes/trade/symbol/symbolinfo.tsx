import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useWsObserver, WsChannels } from '~/hooks/useWsObserver';
import { processSymbolInfo } from '~/processors/processSymbolInfo';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getTimeUntilNextHour } from '~/utils/orderbook/OrderBookUtils';
import styles from './symbolinfo.module.css';
import SymbolInfoField from './symbolinfofield/symbolinfofield';

interface SymbolInfoProps {}

const symbolList = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE'];

const SymbolInfo: React.FC<SymbolInfoProps> = ({}) => {
    const { subscribe, unsubscribe, unsubscribeAllByChannel } = useWsObserver();

    const { symbol, setSymbolInfo, symbolInfo } = useTradeDataStore();

    const navigate = useNavigate();

    const { formatNum } = useNumFormatter();

    const { orderBookMode } = useAppSettings();

    useEffect(() => {
        subscribe(WsChannels.ACTIVE_COIN_DATA, {
            payload: { coin: symbol },
            handler: (payload) => {
                if (payload.coin === symbol) {
                    setSymbolInfo(processSymbolInfo(payload));
                }
            },
            single: true,
        });
        // Unsubscribe when component unmounts
        return () => {
            unsubscribeAllByChannel('activeAssetCtx');
        };
    }, [symbol]);

    const get24hChangeString = () => {
        if (symbolInfo) {
            const usdChange = symbolInfo.markPx - symbolInfo.prevDayPx;
            const percentChange = (usdChange / symbolInfo.prevDayPx) * 100;
            return {
                str: `${usdChange > 0 ? '+' : ''}${formatNum(
                    usdChange,
                )} / ${formatNum(percentChange, 2)}%`,
                usdChange,
            };
        }
        return { str: '+0.0 / %0.0', usdChange: 0 };
    };

    return (
        <div className={styles.symbolInfoContainer}>
            <div className={styles.symbolSelector}>
                <ComboBox
                    value={symbol}
                    options={symbolList}
                    onChange={(value) => {
                        navigate(`/trade/${value}`);
                    }}
                    modifyOptions={(value) => (value += '-USD')}
                    modifyValue={(value) => (value += '-USD')}
                    type={'big-val'}
                />
            </div>
            <div>
                {symbolInfo && symbolInfo.coin === symbol && (
                    <HorizontalScrollable
                        className={
                            orderBookMode === 'large'
                                ? styles.symbolInfoLimitorNarrow
                                : styles.symbolInfoLimitor
                        }
                    >
                        <div
                            className={`${styles.symbolInfoFieldsWrapper} ${
                                orderBookMode === 'large'
                                    ? styles.symbolInfoFieldsWrapperNarrow
                                    : ''
                            }`}
                        >
                            <SymbolInfoField
                                label='Mark'
                                value={'$' + formatNum(symbolInfo?.markPx)}
                                lastWsChange={symbolInfo?.lastPriceChange}
                            />
                            <SymbolInfoField
                                label='Oracle'
                                value={'$' + formatNum(symbolInfo?.oraclePx)}
                            />
                            <SymbolInfoField
                                label='24h Change'
                                value={get24hChangeString().str}
                                type={
                                    get24hChangeString().usdChange > 0
                                        ? 'positive'
                                        : get24hChangeString().usdChange < 0
                                        ? 'negative'
                                        : undefined
                                }
                            />
                            <SymbolInfoField
                                label='24h Volume'
                                value={
                                    '$' + formatNum(symbolInfo?.dayNtlVlm, 2)
                                }
                            />
                            <SymbolInfoField
                                label='Open Interest'
                                value={
                                    '$' +
                                    formatNum(
                                        symbolInfo?.openInterest *
                                            symbolInfo?.oraclePx,
                                        2,
                                    )
                                }
                            />
                            <SymbolInfoField
                                label='Funding Rate'
                                value={
                                    (symbolInfo?.funding * 100)
                                        .toString()
                                        .substring(0, 7) + '%'
                                }
                                type={
                                    symbolInfo?.funding < 0
                                        ? 'positive'
                                        : symbolInfo?.funding > 0
                                        ? 'negative'
                                        : undefined
                                }
                            />
                            <SymbolInfoField
                                label='Funding Countdown'
                                value={getTimeUntilNextHour()}
                            />
                        </div>
                    </HorizontalScrollable>
                )}
            </div>
        </div>
    );
};

export default SymbolInfo;
