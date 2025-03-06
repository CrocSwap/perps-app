import { BsThreeDots } from 'react-icons/bs';
import OrderBook from './orderbook';
import styles from './orderbooksection.module.css';
import OrderBookTrades from './orderbooktrades';
import Tabs from '~/components/Tabs/Tabs';
import BasicMenu from '~/components/BasicMenu/BasicMenu';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
interface OrderBookSectionProps {
  symbol: string;
}

const OrderBookSection: React.FC<OrderBookSectionProps> = ({ symbol }) => {
  

    const [orderCount, setOrderCount] = useState(9);
    const [tradesCount, setTradesCount] = useState(25);
    const orderCountForStacked = useMemo(() => {
        return Math.ceil(orderCount / 2);
    }, [orderCount]);

    const orderBookComponent = useMemo(() => <OrderBook symbol={symbol} orderCount={orderCount} />, [orderCount, symbol]);
    const orderBookTrades = useMemo(() => <OrderBookTrades symbol={symbol} tradesCount={tradesCount} />, [tradesCount, symbol]);
    const { orderBookMode, setOrderBookMode } = useAppSettings();
    const orderBookModeRef = useRef(orderBookMode);
    
    const calculateOrderCount = () => {
      const orderBookSection = document.getElementById('orderBookSection');
      if(orderBookSection) {
        const wrapperHeight = orderBookSection.getBoundingClientRect().height;
        if(orderBookModeRef.current !== 'stacked') {
        const orderCount = Math.floor(wrapperHeight / 60);
        setOrderCount(orderCount);
        setTradesCount(Math.floor(wrapperHeight / 23));
      }else {
        const orderCount = Math.floor(wrapperHeight / 1000);
        setOrderCount(orderCount);
      }
    }
  }



    useEffect(() => {
        
        window.addEventListener('resize', () => {
            calculateOrderCount();
        });

        calculateOrderCount();
      
    }, []);

    // useEffect(() => {
    //   calculateOrderCount();
    // }, [orderBookMode])

    const menuItems = [
        {
            label: 'Tab',
            listener: () => {
                setOrderBookMode('tab');
            }
        },
        {
            label: 'Stacked',
            listener: () => {
                setOrderBookMode('stacked');
            }
        },
        {
            label: 'Large',
            listener: () => {
                setOrderBookMode('large');
            }
        }
    ]
    const tabs = useMemo(() => {
      return [
        {
            label: 'Order Book',
            content: orderBookComponent
        },
        {
            label: 'Trades',
            content: orderBookTrades
        }
        
    ]}, [orderBookComponent, orderBookTrades]);


  return (
    <>
    <div className={styles.orderBookSection}>
      {orderBookMode === 'tab' && (
        <Tabs tabs={tabs} 
          headerRightContent={
            <BasicMenu items={menuItems} icon={<BsThreeDots />} />
          }
            />
      )}
      {orderBookMode === 'stacked' && (
        <div className={styles.stackedContainer}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>Order Book</div>
            <BasicMenu items={menuItems} icon={<BsThreeDots />} />
          </div>
          <OrderBook symbol={symbol} orderCount={orderCountForStacked} />
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>Trades</div>
            <BasicMenu items={menuItems} icon={<BsThreeDots />} />
          </div>
          {orderBookTrades}
        </div>
      )}
      {orderBookMode === 'large' && (
        <div className={styles.largeContainer}>
          <div className={styles.childOfLargeContainer}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>Order Book</div>
          </div>
            <OrderBook symbol={symbol} orderCount={orderCount} />
          </div>
          <div className={styles.childOfLargeContainer}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>Trades</div>
            <BasicMenu items={menuItems} icon={<BsThreeDots />} />
          </div>
            {orderBookTrades}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default OrderBookSection;
