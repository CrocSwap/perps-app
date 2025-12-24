import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
    TabController,
    DashboardTab,
    DASHBOARD_TAB_CONFIGS,
} from './TabController';
import { ReferredUsersView } from '../views/ReferredUsersView';
import { LinksView } from '../views/LinksView';
import { CommissionActivityView } from '../views/CommissionActivityView';
import { ResourcesView } from '../views/ResourcesView';
import styles from '../affiliates.module.css';

export function DashboardTabsSection() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [view, setView] = useState(
        searchParams.get('view') || DashboardTab.ReferredUsers,
    );

    useEffect(() => {
        const viewParam = searchParams.get('view');
        if (viewParam) {
            setView(viewParam);
        } else {
            setSearchParams(
                { view: DashboardTab.ReferredUsers },
                { replace: true },
            );
        }
    }, [searchParams, setSearchParams]);

    const selectedTab = useMemo(() => {
        if (!view) return DashboardTab.ReferredUsers;
        return (view as DashboardTab) || DashboardTab.ReferredUsers;
    }, [view]);

    const handleTabChange = (newTab: DashboardTab) => {
        setSearchParams({ view: newTab }, { replace: true });
    };

    const renderTabContent = () => {
        switch (selectedTab) {
            case DashboardTab.ReferredUsers:
                return <ReferredUsersView />;
            case DashboardTab.Links:
                return <LinksView />;
            case DashboardTab.CommissionActivity:
                return <CommissionActivityView />;
            case DashboardTab.Resources:
                return <ResourcesView />;
            default:
                return <ReferredUsersView />;
        }
    };

    return (
        <section
            className={styles.section}
            style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
        >
            <TabController
                selectedTab={selectedTab}
                onTabChange={handleTabChange}
                tabConfigs={DASHBOARD_TAB_CONFIGS}
            />

            <div
                key={selectedTab}
                className={styles['animate-fade-in']}
                role='tabpanel'
            >
                {renderTabContent()}
            </div>
        </section>
    );
}
