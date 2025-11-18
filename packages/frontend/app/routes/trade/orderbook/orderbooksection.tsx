import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import BasicMenu from '~/components/BasicMenu/BasicMenu';
import Tabs from '~/components/Tabs/Tabs';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { getElementHeightWithMargins } from '~/utils/Utils';
import OrderBook from './orderbook';
import styles from './orderbooksection.module.css';
import OrderBookTrades from './orderbooktrades';
import type { TabType } from '~/routes/trade';
import { useTranslation } from 'react-i18next';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useAppStateStore } from '~/stores/AppStateStore';

interface propsIF {
    mobileView?: boolean;
    mobileContent?: 'orderBook' | 'recentTrades';
    switchTab?: (tab: TabType) => void;
    chartTopHeight?: number;
}

const ORDER_ROW_HEIGHT_FALLBACK = 16;
const ORDER_ROW_GAP = 4;

export default function OrderBookSection(props: propsIF) {
    const { mobileView, mobileContent, switchTab, chartTopHeight } = props;
    const [tradesMaxHeight, setTradesMaxHeight] = useState(0);

    const { t, i18n } = useTranslation();

    const { orderBookMode, setOrderBookMode } = useAppSettings();
    const { orderCount, setOrderCount, setActiveOrderTab } =
        useOrderBookStore();
    const orderBookModeRef = useRef(orderBookMode);

    const { liquidationsActive } = useAppStateStore();

    // Sync ref with state
    useEffect(() => {
        orderBookModeRef.current = orderBookMode;
    }, [orderBookMode]);

    useEffect(() => {
        if (orderBookModeRef.current === 'stacked' && liquidationsActive) {
            setOrderBookMode('tab');
            orderBookModeRef.current = 'tab';
        }
    }, [liquidationsActive]);

    const menuItems = useMemo(
        () => [
            {
                label: t('orderBook.tab'),
                listener: () => setOrderBookMode('tab'),
            },
            {
                label: t('orderBook.stacked'),

                listener: () => setOrderBookMode('stacked'),

                exclude: liquidationsActive,
            },
            {
                label: t('orderBook.large'),
                listener: () => setOrderBookMode('large'),
            },
        ],
        [setOrderBookMode, i18n.language, liquidationsActive],
    );

    const orderBookComponent = useMemo(
        () =>
            orderCount > 0 ? (
                <OrderBook orderCount={orderCount} switchTab={switchTab} />
            ) : null,
        [orderCount, switchTab],
    );

    const orderBookTradesComponent = useCallback(
        (maxHeight?: number) => <OrderBookTrades maxHeight={maxHeight} />,
        [tradesMaxHeight],
    );

    const orderBookTabs = useMemo(
        () => ['orderBook.book', 'orderBook.trades'],
        [],
    );
    const [activeTab, setActiveTab] = useState(orderBookTabs[0]);

    const handleTabChange = useCallback((tab: string) => {
        (setActiveTab(tab), setActiveOrderTab(tab));
    }, []);

    const renderTabContent = useCallback(() => {
        if (activeTab === 'orderBook.trades')
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
        let orderBookSection = document.getElementById('orderBookSection');
        if (!orderBookSection) {
            orderBookSection = document.getElementById(
                'orderBookContainerInner',
            );
        }
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
            // use remaining height for trades (min 40% of available height)
            // that calculation adds more space if we can not place two rows for orderbook
            otherHeightTrades += getElementHeightWithMargins(
                document.getElementById(
                    'orderBookContainerInner',
                ) as HTMLElement,
            );
            otherHeightTrades += getElementHeightWithMargins(
                document.getElementById(
                    'orderBookHeaderStackedMode',
                ) as HTMLElement,
            );
            setTradesMaxHeight(availableHeight - otherHeightTrades);

            // 60% height for orderbook
            availableHeight *= 0.6;
        } else {
            setTradesMaxHeight(
                availableHeight -
                    otherHeightTrades +
                    (orderBookModeRef.current === 'large' ? 0 : -5),
            );
        }

        const calculatedOrderCount = Math.floor(
            (availableHeight - otherHeightOB + ORDER_ROW_GAP * 2) /
                (orderRowHeightWithGaps * 2),
        );

        if (orderCount !== calculatedOrderCount)
            setOrderCount(calculatedOrderCount);
    }, [orderCount, orderBookMode, activeTab]);

    // Resize effect
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

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

    useEffect(() => {
        if (chartTopHeight) {
            calculateOrderCount();
        }
    }, [chartTopHeight, calculateOrderCount]);

    // Menu content
    const menuContent = useMemo(
        () => (
            <div className={styles.menuContent}>
                <BasicMenu items={menuItems} icon={<BsThreeDots size={14} />} />
            </div>
        ),
        [menuItems, liquidationsActive],
    );

    const stackedOrderBook = useMemo(
        () => (
            <div className={styles.orderBookSection}>
                <div className={styles.stackedContainer}>
                    <div
                        id='orderBookHeaderStackedMode'
                        className={styles.sectionHeader}
                    >
                        <div className={styles.sectionHeaderTitle}>
                            {t('orderBook.book')}
                        </div>
                        <BasicMenu
                            items={menuItems}
                            icon={<BsThreeDots size={14} />}
                        />
                    </div>
                    <OrderBook orderCount={orderCount} />
                    <div
                        id={'orderTradesHeaderStackedMode'}
                        className={styles.sectionHeader}
                    >
                        <div className={styles.sectionHeaderTitle}>
                            {t('orderBook.trades')}
                        </div>
                        <BasicMenu
                            items={menuItems}
                            icon={<BsThreeDots size={14} />}
                        />
                    </div>
                    {orderBookTradesComponent(tradesMaxHeight)}
                </div>
            </div>
        ),
        [orderCount, tradesMaxHeight, i18n.language, liquidationsActive],
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
                                {t('orderBook.book')}
                            </div>
                        </div>
                        <OrderBook
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
                                {t('orderBook.trades')}
                            </div>
                            <BasicMenu
                                items={menuItems}
                                icon={<BsThreeDots size={14} />}
                            />
                        </div>
                        {orderBookTradesComponent(tradesMaxHeight)}
                    </div>
                </div>
            </div>
        ),
        [orderCount, tradesMaxHeight, i18n.language, liquidationsActive],
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
        if (mobileContent === 'recentTrades') return orderBookTradesComponent();
    }

    // Desktop view logic
    return (
        <>
            {orderBookMode === 'tab' && orderBookTabsComponent}
            {orderBookMode === 'stacked' && stackedOrderBook}
            {orderBookMode === 'large' && largeOrderBook}
        </>
    );
}
