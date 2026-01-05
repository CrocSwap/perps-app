import { useRef, useState, useEffect, useCallback } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import styles from '../affiliates.module.css';

export enum DashboardTab {
    ReferredUsers = 'affiliate-history',
    Links = 'links',
    CommissionActivity = 'commission-activity',
    Resources = 'resources',
}

export interface DashboardTabConfig {
    value: DashboardTab;
    label: string;
}

interface TabControllerProps {
    selectedTab: DashboardTab;
    onTabChange: (newValue: DashboardTab) => void;
    tabConfigs: DashboardTabConfig[];
}

export function TabController({
    selectedTab,
    onTabChange,
    tabConfigs,
}: TabControllerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const updateArrowVisibility = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        updateArrowVisibility();
        container.addEventListener('scroll', updateArrowVisibility);
        window.addEventListener('resize', updateArrowVisibility);

        return () => {
            container.removeEventListener('scroll', updateArrowVisibility);
            window.removeEventListener('resize', updateArrowVisibility);
        };
    }, [updateArrowVisibility]);

    if (tabConfigs.length === 0) {
        return null;
    }

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 200;
        const targetScroll =
            direction === 'left'
                ? container.scrollLeft - scrollAmount
                : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth',
        });
    };

    return (
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className={styles['pagination-button']}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'var(--aff-surface-hover)',
                        borderRadius: '50%',
                    }}
                    aria-label='Scroll left'
                >
                    <IoChevronBack size={16} />
                </button>
            )}

            <div
                ref={scrollContainerRef}
                className={`${styles['tabs-container']} ${styles['scrollbar-hide']}`}
            >
                {tabConfigs.map((config) => (
                    <button
                        key={config.value}
                        onClick={() => onTabChange(config.value)}
                        className={`${styles['tab-button']} ${
                            selectedTab === config.value ? styles.active : ''
                        }`}
                        aria-selected={selectedTab === config.value}
                        role='tab'
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className={styles['pagination-button']}
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'var(--aff-surface-hover)',
                        borderRadius: '50%',
                    }}
                    aria-label='Scroll right'
                >
                    <IoChevronForward size={16} />
                </button>
            )}
        </div>
    );
}

export const DASHBOARD_TAB_CONFIGS: DashboardTabConfig[] = [
    {
        value: DashboardTab.ReferredUsers,
        label: 'Affiliate History',
    },
    {
        value: DashboardTab.Links,
        label: 'Links',
    },
    {
        value: DashboardTab.CommissionActivity,
        label: 'Commission Activity',
    },
    {
        value: DashboardTab.Resources,
        label: 'Resources',
    },
];
