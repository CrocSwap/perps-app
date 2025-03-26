import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocketContext } from '~/contexts/WebSocketContext';
import OrderRow from './orderrow/orderrow';
import styles from './orderbook.module.css';
import { useWsObserver } from '~/hooks/useWsObserver';
import { processOrderBookMessage, processUserOrders } from '~/processors/processOrderBook';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import type { OrderBookMode, OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';
import { getPrecisionForResolution, getResolutionListForPrice } from '~/utils/orderbook/OrderBookUtils';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import BasicDivider from '~/components/Dividers/BasicDivider';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useDebugStore } from '~/stores/DebugStore';
interface OrderBookProps {
  symbol: string;
  orderCount: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, orderCount }) => {

    const { subscribe, unsubscribeAllByChannel} = useWsObserver();
    const {fetchInfo} = useInfoApi();
    const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
    const resolutionsShouldReset = useRef(true);
    const [selectedResolution, setSelectedResolution] = useState<OrderRowResolutionIF | null>(null);

    // added to pass true resolution to orderrow components
    const filledResolution = useRef<OrderRowResolutionIF | null>(null);

    const assetPrice = useRef<number>(0);
    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');
    const { debugWallet } = useDebugStore();

    const { formatNum, decimalPrecision } = useNumFormatter();


    const {buys, sells, setOrderBook} = useOrderBookStore();
    const {userOrders, setUserOrders, userSymbolOrders} = useTradeDataStore();

    const buySlots = useMemo(() => {
      return buys.map((order) => order.px);
    }, [buys])

    const sellSlots = useMemo(() => {
      return sells.map((order) => order.px);
    }, [sells])


    const findClosestSlot = useCallback((orderPriceRounded: number, slots: number[], gapTreshold: number) => {
      let closestSlot = null;
      slots.map((slot) => {
        if(Math.abs(slot - orderPriceRounded) <= gapTreshold){
          closestSlot = slot;
          return;
        }
      })

      return closestSlot;

    }, [])

    // useEffect(() => {

    //   console.log('>>> user orders', userOrders);
    // }, [userOrders])

    const userBuySlots:Set<string> = useMemo(() => {
      if(!filledResolution.current){
        return new Set<string>();
      }

      const precision = getPrecisionForResolution(filledResolution.current);
      const gapTreshold = filledResolution.current.val / 2;
      const slots = new Set<string>();

      userSymbolOrders.filter((order) => order.side === 'buy').map((order) => {
        const orderPriceRounded = Number(new Number(order.limitPx).toFixed(precision));

        const closestSlot = findClosestSlot(orderPriceRounded, buySlots, gapTreshold);
        if(closestSlot){
          slots.add(formatNum(closestSlot, filledResolution.current));
        }
        else{ 
          // if not found with gapTreshold, extend treshhold to place order
          // mostly to place very top (buy) or bottom (sell) slots in orderbook
          const closestSlot = findClosestSlot(orderPriceRounded, buySlots, gapTreshold * 2);
          if(closestSlot){
            slots.add(formatNum(closestSlot, filledResolution.current));
          }
        }
      })
      return slots;
    }, [userSymbolOrders, filledResolution.current, JSON.stringify(buySlots)])

    const userSellSlots:Set<string> = useMemo(() => {
      if(!filledResolution.current){
        return new Set<string>();
      }

      const precision = getPrecisionForResolution(filledResolution.current);
      const gapTreshold = filledResolution.current.val / 2;
      const slots = new Set<string>();

      userSymbolOrders.filter((order) => order.side === 'sell').map((order) => {
        const orderPriceRounded = Number(new Number(order.limitPx).toFixed(precision));

        const closestSlot = findClosestSlot(orderPriceRounded, sellSlots, gapTreshold);
        if(closestSlot){
          slots.add(formatNum(closestSlot, filledResolution.current));
        }
        else{
          const closestSlot = findClosestSlot(orderPriceRounded, sellSlots, gapTreshold * 2);
          if(closestSlot){
            slots.add(formatNum(closestSlot, filledResolution.current));
          }
        }
      })
      return slots;
    }, [userSymbolOrders, filledResolution.current, JSON.stringify(sellSlots)])

    // useEffect(() => {

    //   console.log('>>> user symbol orders', userSymbolOrders);
    // }, [userSymbolOrders])

    const changeSubscription = (payload: any) => {
      subscribe('l2Book', 
        {payload: payload,
        handler: (response) => {
          filledResolution.current = payload.resolution;
          const {sells, buys} = processOrderBookMessage(response, orderCount);
          setOrderBook(buys, sells);
        },
        single: true
      })
    }

    useEffect(() => {

      fetchInfo({
        type: 'frontendOpenOrders',
        payload: {
          user: debugWallet.address
        },
        handler: (payload) => {

          if(payload && payload.length > 0){
            const userOrders = processUserOrders(payload, 'open');
            setUserOrders(userOrders);
          }
        }
      })


      return () => {
        unsubscribeAllByChannel('l2Book');
      }
    }, [debugWallet.address])

    useEffect(() => {
      changeSubscription({coin: symbol, resolution: selectedResolution});
      resolutionsShouldReset.current = true;
    }, [symbol, orderCount])


    useEffect(() => {
      if(selectedResolution){
        changeSubscription({coin: symbol, 
          nSigFigs: selectedResolution.nsigfigs,
          mantissa: selectedResolution.mantissa,
          resolution: selectedResolution
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
            resolution={filledResolution.current}
            userSlots={userSellSlots} />
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
            resolution={filledResolution.current}
            userSlots={userBuySlots} />
          ))} 
    </div>
    </>
  )
}


     
    </div>
  );
}

export default OrderBook;
