import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './symbolinfo.module.css';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import { useWsObserver } from '~/hooks/useWsObserver';
import { useEffect } from 'react';
import { processSymbolInfo } from '~/processors/processSymbolInfo';
import SymbolInfoField from './symbolinfofield/symbolinfofield';
import { getTimeUntilNextHour } from '~/utils/orderbook/OrderBookUtils';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useNavigate } from 'react-router';

interface SymbolInfoProps {
}


const symbolList = [
  'BTC',
  'ETH',
  'SOL',
  'XRP',
  'ADA',
  'DOGE',
]



const SymbolInfo: React.FC<SymbolInfoProps> = ({ }) => {


  const {subscribe, unsubscribeAllByChannel} = useWsObserver();

  const {symbol, setSymbol, setSymbolInfo, symbolInfo} = useTradeDataStore();

  const navigate = useNavigate();

  const { formatNum } = useNumFormatter();

  useEffect(() => {
    return () => {
      unsubscribeAllByChannel('activeAssetCtx');
    }
  }, [])

  useEffect(() => {
    subscribe('activeAssetCtx', {
      payload: {coin: symbol},
      handler: (payload) => {
        if(payload.coin === symbol){
          setSymbolInfo(processSymbolInfo(payload));
        }
      },
      single: true
    })
  }, [symbol])


  const get24hChangeString = () => {
    if(symbolInfo){
      const usdChange = symbolInfo.markPx - symbolInfo.prevDayPx;
      const percentChange = (usdChange / symbolInfo.prevDayPx) * 100;
      return {str:  `${usdChange > 0 ? '+' : ''}${formatNum(usdChange)} / ${formatNum(percentChange, 2)}%`, usdChange};
    }
    return {str: '+0.0 / %0.0', usdChange: 0};
  }

  


  return (
    <div className={styles.symbolInfoContainer}>
      <div className={styles.symbolSelector}> 
        <ComboBox
          value={symbol}
          options={symbolList}
          onChange={(value) => {
            navigate(`/trade/${value}`);
          }}
          modifyOptions={(value) => value += '-USD'}
          modifyValue={(value) => value += '-USD'}
          type={'big-val'}
      />
      </div>
      {
        symbolInfo && symbolInfo.coin === symbol && (
          <div className={styles.symbolInfoFieldsWrapper}>
            <SymbolInfoField label="Mark" value={'$'+formatNum(symbolInfo?.markPx)} lastWsChange={symbolInfo?.lastPriceChange} />
            <SymbolInfoField label="Oracle" value={'$'+formatNum(symbolInfo?.oraclePx)} />
            <SymbolInfoField label="24h Change" value={get24hChangeString().str} type={get24hChangeString().usdChange > 0 ? 'positive' : get24hChangeString().usdChange < 0 ? 'negative' : undefined} />
            <SymbolInfoField label="24h Volume" value={'$'+formatNum(symbolInfo?.dayNtlVlm, 2)} />
            <SymbolInfoField label="Open Interest" value={'$'+formatNum(symbolInfo?.openInterest * symbolInfo?.oraclePx, 2)} />
            <SymbolInfoField label="Funding Rate" value={(symbolInfo?.funding * 100).toString().substring(0, 7)+'%'} type={symbolInfo?.funding < 0 ? 'positive' : symbolInfo?.funding > 0 ? 'negative' : undefined} />
            <SymbolInfoField label="Funding Countdown" value={getTimeUntilNextHour()} />

          </div>
        )
      }

    </div>
  );
}

export default SymbolInfo;
