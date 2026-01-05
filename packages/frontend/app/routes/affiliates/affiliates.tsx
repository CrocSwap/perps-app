import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { IoReload } from 'react-icons/io5';
import { ConnectWalletCard } from './components/ConnectWalletCard';
import { YourStatsSection } from './components/YourStatsSection';
import { DashboardTabsSection } from './components/DashboardTabsSection';
import { AffiliateApplicationForm } from './components/AffiliateApplicationForm';
import { useAffiliateAudience } from './hooks/useAffiliateData';
import { useUserDataStore } from '~/stores/UserDataStore';
import styles from './affiliates.module.css';

function PageLoader() {
    return (
        <div className={styles['page-loader']}>
            <div className={styles.loader} />
        </div>
    );
}

export default function AffiliatesPage() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();

    const { data: audience, isLoading: isLoadingAudience } =
        useAffiliateAudience(userAddress || '', isConnected && !!userAddress);

    // Show connect wallet if not connected
    if (!isConnected) {
        return (
            <div
                className={`${styles['affiliates-root']} ${styles['affiliates-container']}`}
            >
                <div
                    style={{
                        display: 'flex',
                        height: '100%',
                        minHeight: 'calc(100vh - 8rem)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <ConnectWalletCard
                        title='Connect your wallet'
                        description='Connect your wallet to access the affiliate portal'
                    />
                </div>
            </div>
        );
    }

    // Show loading while checking audience (also show loader when data is null but we have a valid address)
    if (isLoadingAudience || (audience === null && userAddress)) {
        return (
            <div
                className={`${styles['affiliates-root']} ${styles['affiliates-container']}`}
            >
                <PageLoader />
            </div>
        );
    }

    // Show application form if not an accepted affiliate
    if (!audience?.isAffiliateAccepted) {
        return (
            <div
                className={`${styles['affiliates-root']} ${styles['affiliates-container']}`}
            >
                <div
                    className={styles.section}
                    style={{ paddingTop: '3rem', paddingBottom: '3rem' }}
                >
                    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
                        <h1
                            style={{
                                marginBottom: '3rem',
                                textAlign: 'center',
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: 'var(--aff-text-primary)',
                            }}
                        >
                            Affiliate Application
                        </h1>
                        <AffiliateApplicationForm />
                    </div>
                </div>
            </div>
        );
    }

    // Show dashboard for accepted affiliates
    return (
        <div
            className={`${styles['affiliates-root']} ${styles['affiliates-container']}`}
        >
            <section className={styles.section} style={{ marginTop: '3rem' }}>
                <h1
                    style={{
                        marginBottom: '0.5rem',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--aff-text-primary)',
                    }}
                >
                    Referral Dashboard
                </h1>
                <p style={{ color: 'var(--aff-text-muted)' }}>
                    Track your earnings as they grow with every referral.
                </p>
            </section>
            <YourStatsSection />
            <DashboardTabsSection />
        </div>
    );
}
