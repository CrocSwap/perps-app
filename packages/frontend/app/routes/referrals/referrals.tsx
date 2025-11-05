import { t } from 'i18next';
import CodeTabs from '~/components/Referrals/CodeTabs/CodeTabs';
import ReferralsTabs from '~/components/Referrals/ReferralsTabs/ReferralsTabs';
import styles from './referrals.module.css';
import AnimatedBackground from '~/components/AnimatedBackground/AnimatedBackground';
// export function meta({}: Route.MetaArgs) {
export function meta() {
    return [
        { title: 'Referrals | Ambient' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

// export default function Referrals({ loaderData }: Route.ComponentProps) {
export default function Referrals() {
    return (
        <div className={styles.container}>
            <AnimatedBackground
                mode='absolute' // anchors to .container
                layers={1} // 1–3; 2 is a nice depth without cost
                opacity={1}
                duration='15s'
                strokeWidth='2'
                palette={{
                    color1: '#1E1E24',
                    color2: '#7371FC',
                    color3: '#CDC1FF',
                }}
            />
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
