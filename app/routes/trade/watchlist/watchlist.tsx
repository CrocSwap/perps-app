import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './watchlist.module.css';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import { useWsObserver } from '~/hooks/useWsObserver';
import { useEffect, useRef, useState } from 'react';
import { processSymbolInfo } from '~/processors/processSymbolInfo';
import { TbHeartFilled } from 'react-icons/tb';
import { FiDollarSign, FiPercent } from 'react-icons/fi';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import WatchListNode from './watchlistnode/watchlistnode';


interface WatchListProps {
}

const LS_KEY_FAV_COINS = 'favorite-coins';


const WatchList: React.FC<WatchListProps> = ({ }) => {


  const {favs, setFavs} = useTradeDataStore();
  const favsRef = useRef<string[]>(null);
  favsRef.current = favs;

  const {subscribe, unsubscribeAllByChannel} = useWsObserver();


  const [favCoins, setFavCoins] = useState<SymbolInfoIF[]>();

  const [watchListMode, setWatchListMode] = useState<'dollar' | 'percent'>('dollar');

  useEffect(() => {
    const lsVal = localStorage.getItem(LS_KEY_FAV_COINS);
    if(lsVal !== null){
      const favs = JSON.parse(lsVal);
      setFavs(favs);
    }
    else{
      setFavs(['BTC', 'ETH', 'SOL'])
    }

    return () => {
      unsubscribeAllByChannel('webData2')
    }
  }, [])

  const processWebData2Message = (payload: any) => {

    const newFavCoins:SymbolInfoIF[] = [];

    if(payload && payload.meta && payload.meta.universe && payload.assetCtxs){

      if(favsRef.current){
        favsRef.current.map(coin => {

          const indexOfCoin = payload.meta.universe.findIndex((item:any) => item.name === coin);
          if(indexOfCoin !== undefined){
            const ctxVal = payload.assetCtxs[indexOfCoin];
            
            const coinObject = processSymbolInfo({coin, ctx: ctxVal});
            newFavCoins.push(coinObject);

          }
          
        })
      }

      setFavCoins([...newFavCoins]);

    }
  }

  useEffect(() => {

    subscribe('webData2',
      {payload: {user: '0x0000000000000000000000000000000000000000'},
    handler: (payload)=>{
      processWebData2Message(payload);
    }}
    )

  }, [favs])


  return (
    <div className={styles.watchListContainer}>

      <TbHeartFilled className={styles.favIcon}/>
      <FiDollarSign onClick={() => setWatchListMode('dollar')} className={`${styles.watchListToolbarIcon} ${watchListMode === 'dollar' ? styles.active : ''}`}/>
      <FiPercent   onClick={() => setWatchListMode('percent')} className={`${styles.watchListToolbarIcon} ${styles.percentIcon}  ${watchListMode === 'percent' ? styles.active : ''}`}/>


    <div className={styles.watchListNodesWrapper}>

      {
        favCoins && favCoins.map(e=><WatchListNode symbol={e} showMode={watchListMode} ></WatchListNode>)
      }
      </div>

      
    </div>
  );
}

export default WatchList;
