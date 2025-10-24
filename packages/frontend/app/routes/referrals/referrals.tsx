import CodeTabs from '~/components/Referrals/CodeTabs/CodeTabs';
import ReferralsTabs from '~/components/Referrals/ReferralsTabs/ReferralsTabs';
import styles from './referrals.module.css';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import { FUUL_API_KEY } from '~/utils/Constants';
import { useUserDataStore } from '~/stores/UserDataStore';

export function meta() {
    return [
        { title: 'Referrals | Ambient' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

export default function Referrals() {
    const { t } = useTranslation();
    const userDataStore = useUserDataStore();

    const [referralData, setReferralData] = useState<any>(null);

    useEffect(() => {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization: `Bearer ${FUUL_API_KEY}`,
            },
        };

        if (!userDataStore.userAddress) {
            setReferralData(null);
            return;
        }

        fetch(
            `https://api.fuul.xyz/api/v1/payouts/leaderboard/points?user_identifier=${userDataStore.userAddress}&user_identifier_type=solana_address`,
            options,
        )
            .then((res) => res.json())
            .then((res) => setReferralData(res))
            .catch((err) => console.error(err));
    }, [userDataStore.userAddress]);

    const referralCount = useMemo(
        () =>
            referralData ? referralData?.results[0]?.total_amount || 0 : '...',
        [referralData],
    );

    return (
        <div className={styles.container}>
            <header>
                {t('referrals.title')}
                <p>
                    {t('referrals.description')}{' '}
                    <a href='https://docs.ambient.finance/' target='_blank'>
                        {t('common.learnMore')}
                    </a>
                </p>
            </header>
            <div className={styles.detailsContainer}>
                <div className={styles.detailsContent}>
                    <h6>{t('referrals.tradersReferred')}</h6>
                    <h3>{referralCount}</h3>
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
