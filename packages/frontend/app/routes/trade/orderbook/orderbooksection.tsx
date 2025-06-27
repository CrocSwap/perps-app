import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import BasicMenu from '~/components/BasicMenu/BasicMenu';
import Tabs from '~/components/Tabs/Tabs';
import { useAppSettings } from '~/stores/AppSettingsStore';
import OrderBook from './orderbook';
import styles from './orderbooksection.module.css';
import OrderBookTrades from './orderbooktrades';
import { getElementHeightWithMargins } from '~/utils/Utils';

interface OrderBookSectionProps {
    symbol: string;
    mobileView?: boolean;
    mobileContent?: 'orderBook' | 'recentTrades';
}

const ORDER_ROW_HEIGHT_FALLBACK = 16;
const ORDER_ROW_GAP = 4;

const OrderBookSection: React.FC<OrderBookSectionProps> = ({
    symbol,
    mobileView = false,
    mobileContent = 'orderBook',
}) => {
    const [orderCount, setOrderCount] = useState(9);
    const [tradesCount, setTradesCount] = useState(25);
    const [tradesMaxHeight, setTradesMaxHeight] = useState(0);

    const { orderBookMode, setOrderBookMode } = useAppSettings();
    const orderBookModeRef = useRef(orderBookMode);

    // Sync ref with state
    useEffect(() => {
        orderBookModeRef.current = orderBookMode;
    }, [orderBookMode]);

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
                <OrderBook symbol={symbol} orderCount={orderCount} />
            ) : null,
        [orderCount, symbol],
    );

    const orderBookTradesComponent = useCallback(
        (maxHeight?: number) => (
            <OrderBookTrades
                symbol={symbol}
                tradesCount={tradesCount}
                maxHeight={maxHeight}
            />
        ),
        [tradesCount, symbol, tradesMaxHeight],
    );

    const orderBookTabs = useMemo(() => ['Book', 'Trades'], []);
    const [activeTab, setActiveTab] = useState(orderBookTabs[0]);

    const handleTabChange = useCallback((tab: string) => setActiveTab(tab), []);

    const renderTabContent = useCallback(() => {
        if (activeTab === 'Trades')
            return orderBookTradesComponent(tradesMaxHeight);
        return orderBookComponent;
    }, [
        activeTab,
        orderBookComponent,
        orderBookTradesComponent,
        tradesMaxHeight,
    ]);

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

        if (availableHeight <= 0) return;

        let otherHeightOB = 0;
        [
            'orderBookTabs',
            'orderBookHeader1',
            'orderBookHeader2',
            'orderBookMidHeader',
            'orderBookMidHeader2',
            'orderBookHeaderLargeMode',
            'orderBookHeaderStackedMode',
        ].forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                otherHeightOB += getElementHeightWithMargins(el);
            }
        });

        let otherHeightTrades = 0;
        [
            'orderBookTabs',
            'orderTradesHeader',
            'orderTradesHeaderLargeMode',
            'orderTradesHeaderStackedMode',
        ].forEach((id) => {
            const el = document.getElementById(id);
            if (el) otherHeightTrades += getElementHeightWithMargins(el);
        });

        if (orderBookModeRef.current === 'stacked') {
            // divide available height by 2 for stacked mode
            availableHeight /= 2;
        }

        setTradesMaxHeight(
            availableHeight -
                otherHeightTrades -
                (orderBookModeRef.current === 'stacked' ? 15 : 0),
        );

        const calculatedOrderCount = Math.floor(
            (availableHeight - otherHeightOB + ORDER_ROW_GAP * 2) /
                (orderRowHeightWithGaps * 2),
        );

        const calculatedTradesCount = Math.floor(
            (availableHeight - otherHeightTrades + ORDER_ROW_GAP * 2) /
                orderRowHeightWithGaps,
        );

        if (orderCount !== calculatedOrderCount)
            setOrderCount(calculatedOrderCount);
        if (tradesCount !== calculatedTradesCount) {
            setTradesCount(calculatedTradesCount - 1);
        }
    }, [orderCount, tradesCount, orderBookMode, activeTab]);

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
                    <OrderBook symbol={symbol} orderCount={orderCount} />
                    <div
                        id={'orderTradesHeaderStackedMode'}
                        className={styles.sectionHeader}
                    >
                        <div className={styles.sectionHeaderTitle}>Trades</div>
                        <BasicMenu items={menuItems} icon={<BsThreeDots />} />
                    </div>
                    {orderBookTradesComponent(tradesMaxHeight)}
                </div>
            </div>
        ),
        [orderCount, symbol],
    );

    const largeOrderBook = useMemo(
        () => (
            <div className={styles.orderBookSection}>
                <div className={styles.largeContainer}>
                    <div className={styles.childOfLargeContainer}>
                        <div
                            id='orderBookHeaderLargeMode'
                            className={styles.sectionHeader}
                        >
                            <div className={styles.sectionHeaderTitle}>
                                Book
                            </div>
                        </div>
                        <OrderBook
                            symbol={symbol}
                            heightOverride={`calc(100% - 24px)`}
                            orderCount={orderCount}
                        />
                    </div>
                    <div className={styles.childOfLargeContainer}>
                        <div
                            id='orderTradesHeaderLargeMode'
                            className={styles.sectionHeader}
                        >
                            <div className={styles.sectionHeaderTitle}>
                                Trades
                            </div>
                            <BasicMenu
                                items={menuItems}
                                icon={<BsThreeDots />}
                            />
                        </div>
                        {orderBookTradesComponent(tradesMaxHeight)}
                    </div>
                </div>
            </div>
        ),
        [orderCount, symbol],
    );

    const orderBookTabsComponent = (
        <div
            className={
                styles.orderBookSectionContainer +
                ' ' +
                styles.orderBookTabSectionContainer
            }
        >
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
