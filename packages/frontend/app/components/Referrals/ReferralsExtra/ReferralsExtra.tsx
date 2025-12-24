import styles from './ReferralsExtra.module.css';

export default function ReferralsExtra() {
    return (
        <section className={styles.referrals_extra}>
            <h4>Join</h4>
            <div>
                <button
                    // navigate to /v2/affiliates
                    onClick={() => (window.location.href = '/v2/affiliates')}
                >
                    Click to Become an Affiliate
                </button>
            </div>
        </section>
    );
}
