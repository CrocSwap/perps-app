import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import OrderRow from './orderrow/orderrow';
import styles from './orderbook.module.css';
import { useWsObserver } from '~/hooks/useWsObserver';
import { processOrderBookMessage } from '~/processors/processOrderBook';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import type { OrderBookMode, OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';
import { getResolutionListForPrice } from '~/utils/orderbook/OrderBookUtils';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import BasicDivider from '~/components/Dividers/BasicDivider';

interface OrderBookProps {
  symbol: string;
  orderCount: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, orderCount }) => {

    const { subscribe, unsubscribeAllByChannel} = useWsObserver();
    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
    const resolutionsShouldReset = useRef(true);
    const [selectedResolution, setSelectedResolution] = useState<OrderRowResolutionIF | null>(null);
    const assetPrice = useRef<number>(0);
    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');

    const {buys, sells, setOrderBook} = useOrderBookStore();

    const [userBuyIndices, setUserBuyIndices] = useState<number[]>([]);
    const [userSellIndices, setUserSellIndices] = useState<number[]>([]);

    const addFakeBuySellsToOrderBook = () => {
      const buysIndices:number[] = [];
      const sellsIndices:number[] = [];
      for (let i = 0; i < 2; i++) {
        const tempIndex = Math.floor(Math.random() * orderCount);
        if(buysIndices.includes(tempIndex)){
          i--;
          continue;
        }
        buysIndices.push(tempIndex);
      }

      for (let i = 0; i < 3; i++) {
        const tempIndex = Math.floor(Math.random() * orderCount);
        if(sellsIndices.includes(tempIndex)){
          i--;
          continue;
        }
        sellsIndices.push(tempIndex);
      }

      setUserBuyIndices(buysIndices);
      setUserSellIndices(sellsIndices);
    }

    const changeSubscription = (payload: any) => {
      subscribe('l2Book', 
        {payload: payload,
        handler: (payload) => {
          const {sells, buys} = processOrderBookMessage(payload, orderCount);
          setOrderBook(buys, sells);
          addFakeBuySellsToOrderBook();
        },
        single: true
      })
    }

    useEffect(() => {
      return () => {
        unsubscribeAllByChannel('l2Book');
      }
    }, [])

    useEffect(() => {
      changeSubscription({coin: symbol});
      resolutionsShouldReset.current = true;
    }, [symbol, orderCount])


    useEffect(() => {
      if(selectedResolution){
        changeSubscription({coin: symbol, 
          nSigFigs: selectedResolution.nsigfigs,
          mantissa: selectedResolution.mantissa
        });
      }
    }, [selectedResolution, orderCount])


  useEffect(() => {
    if(resolutionsShouldReset.current && buys.length > 0 && buys[0].coin === symbol) {
      const resolutions = getResolutionListForPrice(buys[0].px);
      assetPrice.current = buys[0].px;
      setResolutions(resolutions);
      setSelectedResolution(resolutions[0]);
      resolutionsShouldReset.current = false;
    }
  }, [buys])

  return (
    <div className={styles.orderBookContainer}>

<div className={styles.orderBookHeader}>
{
  <ComboBox
    value={selectedResolution?.val}
    options={resolutions}
    fieldName="val"
    onChange={(value) => {
      const resolution = resolutions.find((resolution) => resolution.val === Number(value));
      if(resolution) {
        setSelectedResolution(resolution);
      }
    }}
  />
}

{
  <ComboBox
    value={selectedMode === 'symbol' ? symbol.toUpperCase() : 'USD'}
    options={[symbol.toUpperCase(), 'USD']}
    onChange={(value) => setSelectedMode(value === symbol.toUpperCase() ? 'symbol' : 'usd')}
  />
}


</div>


<div className={styles.orderBookHeader}>

<div>Price</div>
<div>Size {selectedMode === 'symbol' ? `(${symbol.toUpperCase()})` : '(USD)'}</div>
<div>Total {selectedMode === 'symbol' ? `(${symbol.toUpperCase()})` : '(USD)'}</div>

</div>

<BasicDivider />

{
  buys.length > 0 && sells.length > 0 && buys[0].coin === symbol && sells[0].coin === symbol &&
  (
    <>
    <div className={styles.orderBookBlock}>
          {sells.slice(0, orderCount).reverse().map((order, index) => (
            <OrderRow key={order.px} order={order} coef={selectedMode === 'symbol' ? 1 : assetPrice.current} 
            hasUserOrder={userSellIndices.includes(index)} />
          ))}
    </div>
    
    
    <div className={styles.orderBookBlockMid}>
    
          <div>Spread</div>
          <div>{selectedResolution?.val}</div>
          <div>{(assetPrice.current && selectedResolution?.val) && (selectedResolution?.val / assetPrice.current * 100).toFixed(3)}%</div>
    
    </div>
    
    <div className={styles.orderBookBlock}>
          {buys.slice(0, orderCount).map((order, index) => (
            <OrderRow key={order.px} order={order} coef={selectedMode === 'symbol' ? 1 : assetPrice.current} 
            hasUserOrder={userBuyIndices.includes(index)} />
          ))} 
    </div>
    </>
  )
}


     
    </div>
  );
}

export default OrderBook;
