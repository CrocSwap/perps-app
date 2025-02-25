import { useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import OrderRow from './orderrow/orderrow';
import styles from './orderbook.module.css';
import { useWsObserver } from '~/hooks/useWsObserver';
import { processOrderBookMessage } from '~/processors/processOrderBook';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import type { OrderBookMode, OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';
import { getResolutionListForPrice } from '~/utils/orderbook/OrderBookUtils';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';

interface OrderBookProps {
  symbol: string;
  orderCount: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, orderCount }) => {


    const { subscribe} = useWsObserver();
    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
    const resolutionsShouldReset = useRef(true);
    const [selectedResolution, setSelectedResolution] = useState<OrderRowResolutionIF | null>(null);
    const assetPrice = useRef<number>(0);
    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');

    const {buys, sells, setOrderBook} = useOrderBookStore();

    const changeSubscription = (payload: any) => {
      subscribe('l2Book', 
        {payload: payload,
        handler: (payload) => {
          const {sells, buys} = processOrderBookMessage(payload);
          setOrderBook(buys, sells);
        },
        single: true
      })
    }

    useEffect(() => {
      changeSubscription({coin: symbol});
      resolutionsShouldReset.current = true;
    }, [symbol])

    useEffect(() => {
      if(selectedResolution){
        changeSubscription({coin: symbol, 
          nSigFigs: selectedResolution.nsigfigs,
          mantissa: selectedResolution.mantissa
        });
      }
    }, [selectedResolution])


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

<div className={styles.orderBookBlock}>
      {sells.slice(0, orderCount).reverse().map((order) => (
        <OrderRow key={order.px} order={order} coef={selectedMode === 'symbol' ? 1 : assetPrice.current} />
      ))}
</div>


<div className={styles.orderBookBlockMid}>

      <div>Spread</div>
      <div>{selectedResolution?.val}</div>
      <div>{(assetPrice.current && selectedResolution?.val) && (selectedResolution?.val / assetPrice.current * 100).toFixed(3)}%</div>

</div>

<div className={styles.orderBookBlock}>
      {buys.slice(0, orderCount).map((order) => (
        <OrderRow key={order.px} order={order} coef={selectedMode === 'symbol' ? 1 : assetPrice.current} />
      ))} 
</div>

     
    </div>
  );
}

export default OrderBook;
