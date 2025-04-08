import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BasicDivider from '~/components/Dividers/BasicDivider';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import { ApiEndpoints, useInfoApi } from '~/hooks/useInfoApi';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useWsObserver, WsChannels } from '~/hooks/useWsObserver';
import { processOrderBookMessage, processUserOrder } from '~/processors/processOrderBook';
import { useDebugStore } from '~/stores/DebugStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { OrderBookMode, OrderDataIF, OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';
import { getPrecisionForResolution, getResolutionListForPrice } from '~/utils/orderbook/OrderBookUtils';
import styles from './orderbook.module.css';
import OrderRow from './orderrow/orderrow';
interface OrderBookProps {
  symbol: string;
  orderCount: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, orderCount }) => {

  const { subscribe, unsubscribeAllByChannel } = useWsObserver();
  const { fetchData } = useInfoApi();
  const [resolutions, setResolutions] = useState<OrderRowResolutionIF[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<OrderRowResolutionIF | null>(null);

  // added to pass true resolution to orderrow components
  const filledResolution = useRef<OrderRowResolutionIF | null>(null);

  const assetPrice = useRef<number>(0);
  const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');
  const { debugWallet } = useDebugStore();

  const { formatNum, decimalPrecision } = useNumFormatter();

  const { isWsEnabled } = useDebugStore();

  const isWsEnabledRef = useRef<boolean>(true);
  isWsEnabledRef.current = isWsEnabled;

  const { buys, sells, setOrderBook } = useOrderBookStore();
  const { userOrders, setUserOrders, userSymbolOrders, symbolInfo, addOrderToHistory } = useTradeDataStore();
  const userOrdersRef = useRef<OrderDataIF[]>([]);

  const buySlots = useMemo(() => {
    return buys.map((order) => order.px);
  }, [buys])

  const sellSlots = useMemo(() => {
    return sells.map((order) => order.px);
  }, [sells])

  const orderCountRef = useRef<number>(0);
  orderCountRef.current = orderCount;


  const findClosestSlot = useCallback((orderPriceRounded: number, slots: number[], gapTreshold: number) => {
    let closestSlot = null;
    slots.map((slot) => {
      if (Math.abs(slot - orderPriceRounded) <= gapTreshold) {
        closestSlot = slot;
        return;
      }
    })

    return closestSlot;

  }, [])

  useEffect(() => {

    if (userOrdersRef.current.length === 0) {
      userOrdersRef.current = userOrders;
    }
  }, [userOrders])

  const userBuySlots: Set<string> = useMemo(() => {
    if (!filledResolution.current) {
      return new Set<string>();
    }

    const precision = getPrecisionForResolution(filledResolution.current);
    const gapTreshold = filledResolution.current.val / 2;
    const slots = new Set<string>();

    userSymbolOrders.filter((order) => order.side === 'buy').map((order) => {
      const orderPriceRounded = Number(new Number(order.limitPx).toFixed(precision));

      const closestSlot = findClosestSlot(orderPriceRounded, buySlots, gapTreshold);
      if (closestSlot) {
        slots.add(formatNum(closestSlot, filledResolution.current));
      }
      else {
        // if not found with gapTreshold, extend treshhold to place order
        // mostly to place very top (buy) or bottom (sell) slots in orderbook
        const closestSlot = findClosestSlot(orderPriceRounded, buySlots, gapTreshold * 2);
        if (closestSlot) {
          slots.add(formatNum(closestSlot, filledResolution.current));
        }
      }
    })
    return slots;
  }, [userSymbolOrders, filledResolution.current, JSON.stringify(buySlots)])

  const userSellSlots: Set<string> = useMemo(() => {
    if (!filledResolution.current) {
      return new Set<string>();
    }

    const precision = getPrecisionForResolution(filledResolution.current);
    const gapTreshold = filledResolution.current.val / 2;
    const slots = new Set<string>();

    userSymbolOrders.filter((order) => order.side === 'sell').map((order) => {
      const orderPriceRounded = Number(new Number(order.limitPx).toFixed(precision));

      const closestSlot = findClosestSlot(orderPriceRounded, sellSlots, gapTreshold);
      if (closestSlot) {
        slots.add(formatNum(closestSlot, filledResolution.current));
      }
      else {
        const closestSlot = findClosestSlot(orderPriceRounded, sellSlots, gapTreshold * 2);
        if (closestSlot) {
          slots.add(formatNum(closestSlot, filledResolution.current));
        }
      }
    })
    return slots;
  }, [userSymbolOrders, filledResolution.current, JSON.stringify(sellSlots)])


  const changeSubscription = (payload: any) => {
    subscribe(WsChannels.ORDERBOOK,
      {
        payload: payload,
        handler: (response) => {

          if (!isWsEnabledRef.current) {
            return;
          }

          filledResolution.current = payload.resolution;
          const { sells, buys } = processOrderBookMessage(response, orderCountRef.current);
          setOrderBook(buys, sells);
        },
        single: true
      })
  }


  const orderProcessorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {

    if (orderProcessorIntervalRef.current) {
      clearInterval(orderProcessorIntervalRef.current);
    }

    return () => {
      if (orderProcessorIntervalRef.current) {
        clearInterval(orderProcessorIntervalRef.current);
      }
    }
  }, [])



  useEffect(() => {

    if (symbol === symbolInfo?.coin) {
      const resolutionList = getResolutionListForPrice(symbolInfo.markPx);
      setResolutions(resolutionList);
      setSelectedResolution(resolutionList[0]);
    }
  }, [symbol, symbolInfo?.coin])


  useEffect(() => {
    if (selectedResolution) {
      changeSubscription({
        coin: symbol,
        nSigFigs: selectedResolution.nsigfigs,
        mantissa: selectedResolution.mantissa,
        resolution: selectedResolution
      });
    }
  }, [selectedResolution])


  return (
    <div className={styles.orderBookContainer}>

        <div id={'orderBookHeader1'} className={styles.orderBookHeader}>
        {
          <ComboBox
            value={selectedResolution?.val}
            options={resolutions}
            fieldName="val"
            onChange={(value) => {
              const resolution = resolutions.find((resolution) => resolution.val === Number(value));
              if (resolution) {
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


      <div id={'orderBookHeader2'} className={styles.orderBookHeader}>

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
                <OrderRow key={order.px} order={order} coef={selectedMode === 'symbol' ? 1 : symbolInfo?.markPx ?? 0}
                  resolution={filledResolution.current}
                  userSlots={userSellSlots} />
              ))}
            </div>


            <div id='orderBookMidHeader' className={styles.orderBookBlockMid}>

              <div>Spread</div>
              <div>{selectedResolution?.val}</div>
              <div>{(symbolInfo?.markPx && selectedResolution?.val) && (selectedResolution?.val / symbolInfo?.markPx * 100).toFixed(3)}%</div>

            </div>

            <div className={styles.orderBookBlock}>
              {buys.slice(0, orderCount).map((order, index) => (
                <OrderRow key={order.px} order={order} coef={selectedMode === 'symbol' ? 1 : symbolInfo?.markPx ?? 0}
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
