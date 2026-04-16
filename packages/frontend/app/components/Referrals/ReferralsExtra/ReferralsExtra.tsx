import { Suspense } from 'react';
import { useAffiliateStatus } from '~/hooks/useAffiliateStatus';
import Spinner from '~/components/Spinners/Spinner';
import styles from './ReferralsExtra.module.css';

function ReferralsExtraContent() {
    const { isAffiliateAccepted, isLoading } = useAffiliateStatus();

    if (isLoading) {
        return (
            <section className={styles.referrals_extra}>
                <h4>
                    <Spinner size={16} />
                </h4>
                <div>{/* Button hidden during loading */}</div>
            </section>
        );
    }

    return (
        <section className={styles.referrals_extra}>
            <h4>{isAffiliateAccepted ? '' : 'Join'}</h4>
            <div>
                <button
                    // navigate to /v2/affiliates
                    onClick={() => (window.location.href = '/v2/affiliates')}
                >
                    {isAffiliateAccepted
                        ? 'View Dashboard'
                        : 'Become a Partner'}
                </button>
            </div>
        </section>
    );
}

export default function ReferralsExtra() {
    return (
        <Suspense
            fallback={
                <section className={styles.referrals_extra}>
                    <h4>
                        <Spinner size={16} />
                    </h4>
                    <div>{/* Button hidden during loading */}</div>
                </section>
            }
        >
            <ReferralsExtraContent />
        </Suspense>
    );
}
