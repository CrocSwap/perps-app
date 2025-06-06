import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import BasicMenu from '~/components/BasicMenu/BasicMenu';
import Tabs from '~/components/Tabs/Tabs';
import { useAppSettings } from '~/stores/AppSettingsStore';
import OrderBook from './orderbook';
import styles from './orderbooksection.module.css';
import OrderBookTrades from './orderbooktrades';

interface OrderBookSectionProps {
    symbol: string;
    mobileView?: boolean;
    mobileContent?: 'orderBook' | 'recentTrades';
}

const ORDER_ROW_HEIGHT_FALLBACK = 16;
const ORDER_ROW_GAP = 5;

const OrderBookSection: React.FC<OrderBookSectionProps> = ({
    symbol,
    mobileView = false,
    mobileContent = 'orderBook',
}) => {
    const [orderCount, setOrderCount] = useState(9);
    const [tradesCount, setTradesCount] = useState(25);

    const { orderBookMode, setOrderBookMode } = useAppSettings();
    const orderBookModeRef = useRef(orderBookMode);

    // Sync ref with state
    useEffect(() => {
        orderBookModeRef.current = orderBookMode;
    }, [orderBookMode]);

    const orderCountForStacked = useMemo(
        () => Math.ceil(orderCount / 2),
        [orderCount],
    );

    const menuItems = useMemo(
        () => [
            { label: 'Tab', listener: () => setOrderBookMode('tab') },
            { label: 'Stacked', listener: () => setOrderBookMode('stacked') },
            { label: 'Large', listener: () => setOrderBookMode('large') },
        ],
        [setOrderBookMode],
    );

    const orderBookComponent = useMemo(
        () =>
            orderCount > 0 ? (
                <div className={styles.orderbookInTab}>
                    <OrderBook symbol={symbol} orderCount={orderCount} />
                </div>
            ) : null,
        [orderCount, symbol],
    );

    const orderBookTradesComponent = useMemo(
        () => <OrderBookTrades symbol={symbol} tradesCount={tradesCount} />,
        [tradesCount, symbol],
    );

    const orderBookTabs = useMemo(() => ['Book', 'Trades'], []);
    const [activeTab, setActiveTab] = useState(orderBookTabs[0]);

    const handleTabChange = useCallback((tab: string) => setActiveTab(tab), []);

    const renderTabContent = useCallback(() => {
        if (activeTab === 'Trades') return orderBookTradesComponent;
        return orderBookComponent;
    }, [activeTab, orderBookComponent, orderBookTradesComponent]);

    // Height calculation logic
    const calculateOrderCount = useCallback(() => {
        const orderBookSection = document.getElementById('orderBookSection');
        const dummyOrderRow = document.getElementById('dummyOrderRow');
        const orderRowHeight =
            dummyOrderRow?.getBoundingClientRect().height ||
            ORDER_ROW_HEIGHT_FALLBACK;
        const orderRowHeightWithGaps = orderRowHeight + ORDER_ROW_GAP;

        if (!orderBookSection) return;

        let availableHeight = orderBookSection.getBoundingClientRect().height;
        if (
            window.innerHeight / availableHeight < 1.5 &&
            window.innerHeight < 1000
        ) {
            availableHeight = window.innerHeight / 1.5;
        }

        if (availableHeight <= 0) return;

        if (orderBookModeRef.current !== 'stacked') {
            let otherHeightSum = 0;
            ['orderBookTabs', 'orderBookHeader1', 'orderBookHeader2'].forEach(
                (id) => {
                    const el = document.getElementById(id);
                    if (el) otherHeightSum += el.getBoundingClientRect().height;
                },
            );
            const calculatedOrderCount = Math.floor(
                (availableHeight - otherHeightSum) /
                    (orderRowHeightWithGaps * 2),
            );
            if (orderCount !== calculatedOrderCount)
                setOrderCount(calculatedOrderCount);
            setTradesCount(
                Math.floor(availableHeight / orderRowHeightWithGaps) - 2,
            );
        } else {
            const calculatedOrderCount = Math.floor(availableHeight / 1000);
            if (orderCount !== calculatedOrderCount)
                setOrderCount(calculatedOrderCount);
        }
    }, [orderCount]);

    // Resize effect
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        const handleResize = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(calculateOrderCount, 50);
        };

        window.addEventListener('resize', handleResize);
        calculateOrderCount();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [calculateOrderCount]);

    // Menu content
    const menuContent = useMemo(
        () => (
            <div className={styles.menuContent}>
                <BasicMenu items={menuItems} icon={<BsThreeDots />} />
            </div>
        ),
        [menuItems],
    );

    const stackedOrderBook = useMemo(
        () => (
            <div className={styles.orderBookSection}>
                <div className={styles.stackedContainer}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderTitle}>Book</div>
                        <BasicMenu items={menuItems} icon={<BsThreeDots />} />
                    </div>
                    <OrderBook
                        symbol={symbol}
                        orderCount={orderCountForStacked}
                    />
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderTitle}>Trades</div>
                        <BasicMenu items={menuItems} icon={<BsThreeDots />} />
                    </div>
                    {orderBookTradesComponent}
                </div>
            </div>
        ),
        [orderCountForStacked, symbol],
    );

    const largeOrderBook = useMemo(
        () => (
            <div className={styles.orderBookSection}>
                <div className={styles.largeContainer}>
                    <div className={styles.childOfLargeContainer}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionHeaderTitle}>
                                Book
                            </div>
                        </div>
                        <OrderBook symbol={symbol} orderCount={orderCount} />
                    </div>
                    <div className={styles.childOfLargeContainer}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionHeaderTitle}>
                                Trades
                            </div>
                            <BasicMenu
                                items={menuItems}
                                icon={<BsThreeDots />}
                            />
                        </div>
                        {orderBookTradesComponent}
                    </div>
                </div>
            </div>
        ),
        [orderCount, symbol],
    );

    const orderBookTabsComponent = (
        <div className={styles.orderBookSectionContainer}>
            <Tabs
                wrapperId='orderBookTabs'
                tabs={orderBookTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                rightContent={menuContent}
                wide
                flex
            />
            <div className={styles.tabContent}>{renderTabContent()}</div>
        </div>
    );

    // Mobile view logic
    if (mobileView) {
        if (mobileContent === 'orderBook') return orderBookComponent;
        if (mobileContent === 'recentTrades') return orderBookTradesComponent;
    }

    // Desktop view logic
    return (
        <>
            {orderBookMode === 'tab' && orderBookTabsComponent}
            {orderBookMode === 'stacked' && stackedOrderBook}
            {orderBookMode === 'large' && largeOrderBook}
        </>
    );
};

export default OrderBookSection;
