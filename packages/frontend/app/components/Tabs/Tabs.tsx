import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './Tabs.module.css';
import { WsChannels } from '~/utils/Constants';

interface TabProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    layoutId: string;
    notInteractive?: boolean;
    wide?: boolean;
    flex?: boolean;
}

export function Tab(props: TabProps) {
    const {
        label,
        isActive,
        onClick,
        layoutId,
        notInteractive = false,
        wide = false,
        flex = false,
    } = props;

    return (
        <button
            className={`${styles.tab} ${wide ? styles.wideTab : ''} ${flex ? styles.flexTab : ''} ${isActive ? styles.activeTab : ''}`}
            style={{
                color: notInteractive ? 'var(--text1)' : '',
                cursor: notInteractive ? 'auto' : 'cursor',
            }}
            onClick={() => notInteractive || onClick()}
        >
            {label}
            {isActive && (
                <motion.div
                    className={styles.activeIndicator}
                    layoutId={layoutId}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
        </button>
    );
}

export interface TabsProps {
    tabs: Array<string | { id: string; label: string }>;
    defaultTab?: string;
    onTabChange?: (tab: string) => void;
    rightContent?: React.ReactNode;
    wrapperId?: string;
    layoutIdPrefix?: string;
    wide?: boolean;
    flex?: boolean;
}

export default function Tabs(props: TabsProps) {
    const {
        tabs,
        defaultTab,
        onTabChange,
        rightContent,
        wrapperId,
        layoutIdPrefix = 'tabIndicator',
        wide = false,
        flex = false,
    } = props;

    const {
        fetchedChannels,
        userBalances: { length: balancesCount },
        positions: { length: positionsCount },
        userOrders: { length: openOrdersCount },
        activeTwaps: { length: activeTwapsCount },
    } = useTradeDataStore();

    const webDataFetched = useMemo(() => {
        return fetchedChannels.has(WsChannels.WEB_DATA2);
    }, [fetchedChannels]);

    // Function to get tab ID (either the string itself or the id property)
    const getTabId = (tab: string | { id: string; label: string }): string => {
        return typeof tab === 'string' ? tab : tab.id;
    };

    // Function to get tab label (either the string itself or the label property)
    const getTabLabel = (
        tab: string | { id: string; label: string },
    ): string => {
        let label = typeof tab === 'string' ? tab : tab.label;
        if (label === 'Balances' && webDataFetched && balancesCount > 0) {
            label = `Balances (${balancesCount})`;
        } else if (
            label === 'Positions' &&
            webDataFetched &&
            positionsCount > 0
        ) {
            label = `Positions (${positionsCount})`;
        } else if (
            label === 'Open Orders' &&
            webDataFetched &&
            openOrdersCount > 0
        ) {
            label = `Open Orders (${openOrdersCount})`;
        } else if (label === 'Twap' && webDataFetched && activeTwapsCount > 0) {
            label = `Twap (${activeTwapsCount})`;
        }
        return label;
    };

    // Set default active tab
    const defaultTabId = defaultTab || getTabId(tabs[0]);
    const [activeTab, setActiveTab] = useState<string>(defaultTabId);

    useEffect(() => {
        setActiveTab(defaultTabId);
    }, [defaultTabId]);

    const tabsListRef = useRef<HTMLDivElement>(null);
    const tabsWrapperRef = useRef<HTMLDivElement>(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    // Check if the tabs can be scrolled
    const checkScroll = () => {
        if (tabsListRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } =
                tabsListRef.current;

            // Can scroll left if we're not at the beginning
            setCanScrollLeft(scrollLeft > 1);

            // Can scroll right if we're not at the end
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    // Scroll the active tab into view when active tab changes
    useEffect(() => {
        if (tabsListRef.current) {
            const activeTabElement = tabsListRef.current.querySelector(
                `.${styles.activeTab}`,
            );
            if (activeTabElement) {
                // Calculate the scroll position to center the tab
                const tabsList = tabsListRef.current;
                const tabsListWidth = tabsList.offsetWidth;
                const activeTabWidth = (activeTabElement as HTMLElement)
                    .offsetWidth;
                const activeTabLeft = (activeTabElement as HTMLElement)
                    .offsetLeft;

                const scrollPosition =
                    activeTabLeft - tabsListWidth / 2 + activeTabWidth / 2;

                tabsList.scrollTo({
                    left: Math.max(0, scrollPosition),
                    behavior: 'smooth',
                });

                // Check scroll state after scrolling
                setTimeout(checkScroll, 350); // Delay for smooth scroll animation
            }
        }
    }, [activeTab]);

    // Check scroll state on mount and when window resizes
    useEffect(() => {
        checkScroll();

        const handleResize = () => {
            checkScroll();
        };

        window.addEventListener('resize', handleResize);

        // Initialize scroll state
        if (tabsListRef.current) {
            tabsListRef.current.addEventListener('scroll', checkScroll);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (tabsListRef.current) {
                tabsListRef.current.removeEventListener('scroll', checkScroll);
            }
        };
    }, []);

    const scrollLeft = () => {
        if (tabsListRef.current) {
            const { clientWidth } = tabsListRef.current;
            // Scroll half the width of the container
            tabsListRef.current.scrollBy({
                left: -clientWidth / 2,
                behavior: 'smooth',
            });
        }
    };

    const scrollRight = () => {
        if (tabsListRef.current) {
            const { clientWidth } = tabsListRef.current;
            // Scroll half the width of the container
            tabsListRef.current.scrollBy({
                left: clientWidth / 2,
                behavior: 'smooth',
            });
        }
    };

    // Create a unique layoutId for this specific tabs instance
    const layoutId = `${layoutIdPrefix}-${wrapperId || ''}`;

    return (
        <div
            {...(wrapperId ? { id: wrapperId } : {})}
            className={styles.tabsContainer}
        >
            <div
                className={`${styles.tabsWrapper} ${canScrollLeft ? styles.showLeftFade : ''} ${canScrollRight ? styles.showRightFade : ''}`}
                ref={tabsWrapperRef}
            >
                {/* Left scroll arrow */}
                {canScrollLeft && (
                    <button
                        className={`${styles.scrollArrow} ${styles.scrollArrowLeft}`}
                        onClick={scrollLeft}
                        aria-label='Scroll tabs left'
                    >
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z' />
                        </svg>
                    </button>
                )}

                {/* Tabs list */}
                <div
                    className={styles.tabsList}
                    ref={tabsListRef}
                    onScroll={checkScroll}
                >
                    {tabs.map((tab, idx) => {
                        const tabId = getTabId(tab);
                        const tabLabel = getTabLabel(tab);
                        return (
                            <Tab
                                key={tabId + tabLabel + idx} // Ensure unique key
                                label={tabLabel}
                                isActive={activeTab === tabId}
                                onClick={() => handleTabClick(tabId)}
                                notInteractive={tabs.length <= 1}
                                layoutId={layoutId} // Pass the unique layoutId
                                wide={wide}
                                flex={flex}
                            />
                        );
                    })}
                </div>

                {/* Right scroll arrow */}
                {canScrollRight && (
                    <button
                        className={`${styles.scrollArrow} ${styles.scrollArrowRight}`}
                        onClick={scrollRight}
                        aria-label='Scroll tabs right'
                    >
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' />
                        </svg>
                    </button>
                )}
            </div>

            {rightContent && (
                <div className={styles.rightContent}>{rightContent}</div>
            )}
        </div>
    );
}
