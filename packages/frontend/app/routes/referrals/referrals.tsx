import type { Route } from '../../+types/root';
import styles from './referrals.module.css';
import CodeTabs from '~/components/Referrals/CodeTabs/CodeTabs';
import ReferralsTabs from '~/components/Referrals/ReferralsTabs/ReferralsTabs';
// import styles from './referrals.module.css'
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Perps - Referrals' },
        { name: 'description', content: 'Welcome to React Router!' },
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}

export default function Referrals({ loaderData }: Route.ComponentProps) {
    return (
        <div className={styles.container}>
            <header>
                Referrals
                <p>
                    Refer users to earn rewards. Affiliates earn greater
                    rewards. Learn More <a href='#'>Learn More</a>
                </p>
            </header>
            <div className={styles.detailsContainer}>
                <div className={styles.detailsContent}>
                    <h6>Traders Referred</h6>
                    <h3>0</h3>
                </div>
                <div className={styles.detailsContent}>
                    <h6>Rewards Earned</h6>
                    <h3>$0.00</h3>
                </div>
            </div>
            <section className={styles.tableContainer}>
                <CodeTabs />
                <ReferralsTabs/>

            </section>
        </div>
    );
}
