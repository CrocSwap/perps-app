import { useTranslation } from 'react-i18next';
import CodeTabs from '~/components/Referrals/CodeTabs/CodeTabs';
import ReferralsTabs from '~/components/Referrals/ReferralsTabs/ReferralsTabs';
import styles from './referrals.module.css';
// import styles from './referrals.module.css'
// export function meta({}: Route.MetaArgs) {
export function meta() {
    return [
        { title: 'Referrals | Ambient' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

// export default function Referrals({ loaderData }: Route.ComponentProps) {
export default function Referrals() {
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            <header>
                {t('referrals.title')}
                <p>
                    {t('referrals.description')}{' '}
                    <a href='#'>{t('common.learnMore')}</a>
                </p>
            </header>
            <div className={styles.detailsContainer}>
                <div className={styles.detailsContent}>
                    <h6>{t('referrals.tradersReferred')}</h6>
                    <h3>0</h3>
                </div>
                <div className={styles.detailsContent}>
                    <h6>{t('referrals.rewardsEarned')}</h6>
                    <h3>$0.00</h3>
                </div>
            </div>
            <section className={styles.tableContainer}>
                <CodeTabs />
                <ReferralsTabs />
            </section>
        </div>
    );
}
