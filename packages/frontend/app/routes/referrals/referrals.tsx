import CodeTabs from '~/components/Referrals/CodeTabs/CodeTabs';
import ReferralsTabs from '~/components/Referrals/ReferralsTabs/ReferralsTabs';
import styles from './referrals.module.css';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import { FUUL_API_KEY, FUUL_GET_API_KEY } from '~/utils/Constants';
import { useUserDataStore } from '~/stores/UserDataStore';
import AnimatedBackground from '~/components/AnimatedBackground/AnimatedBackground';
import useNumFormatter from '~/hooks/useNumFormatter';
import ReferralsExtra from '~/components/Referrals/ReferralsExtra/ReferralsExtra';
import SimpleButton from '~/components/SimpleButton/SimpleButton';

export function meta() {
    return [
        { title: 'Referrals | Ambient Finance' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

export interface PayoutMovementIF {
    payout_id: string;
    date: string;
    currency_address: string;
    chain_id: number;
    is_referrer: boolean;
    conversion_id: string;
    conversion_name: string;
    total_amount: string;
    project_name: string;
    payout_status: 'pending' | 'completed';
    // what actually is this?
    payout_status_details: null;
    user_identifier: string;
    referrer_identifier: string;
}

interface PayoutMovementsResponseIF {
    total_results: number;
    page: number;
    page_size: number;
    results: PayoutMovementIF[];
}

export interface PayoutByReferrerCurrencyIF {
    address: string;
    chainId: string;
}

export type PayoutByReferrerEarningsT = {
    currency: {
        address: string;
        chainId: string;
    };
    amount: number;
};

export type PayoutByReferrerT = {
    [key: string]: {
        volume: number;
        earnings: PayoutByReferrerEarningsT[];
    };
};

export default function Referrals() {
    const { t } = useTranslation();
    const userDataStore = useUserDataStore();

    const [referralData, setReferralData] = useState<any>(null);

    const { formatNum } = useNumFormatter();

    const [rewardsEarned, setRewardsEarned] = useState<string>('...');

    const [referralCount, setReferralCount] = useState<string>('...');

    const [payoutMovements, setPayoutMovements] = useState<PayoutMovementIF[]>(
        [],
    );
    useEffect(() => {
        const OPTIONS = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization: `Bearer ${FUUL_GET_API_KEY}`,
            },
        };

        fetch(
            `https://api.fuul.xyz/api/v1/payouts/movements?user_identifier=${userDataStore.userAddress}&identifier_type=solana_address&type=point`,
            OPTIONS,
        )
            .then((res) => res.json())
            .then((res: PayoutMovementsResponseIF) => {
                console.log(res);
                setPayoutMovements(res.results);
            })
            .catch((err) => console.error(err));
    }, []);

    const [payoutsByReferrer, setPayoutsByReferrer] = useState<
        PayoutByReferrerT[]
    >([]);

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

        const optionsPayouts = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization:
                    'Bearer 7010050cc4b7274037a80fd9119bce3567ce7443d163c097c787a39dac341870',
            },
        };

        fetch(
            `https://api.fuul.xyz/api/v1/payouts/by-referrer?user_identifier=${userDataStore.userAddress}&user_identifier_type=solana_address`,
            optionsPayouts,
        )
            .then((res) => res.json())
            .then((res) => {
                console.log('payouts: ', res);
                console.log('calculating payouts...');
                setPayoutsByReferrer(res);
                setReferralCount(res.length.toString());
                const totalPayouts: number = res.reduce(
                    (acc: number, payout: any) => {
                        // Each payout object has one unknown key with an object value containing volume
                        const payoutValue = Object.values(payout)[0] as any;
                        const volume = payoutValue?.volume || 0;
                        console.log('volume: ', volume);
                        return acc + volume;
                    },
                    0,
                );
                const totalPayoutsFormatted = formatNum(
                    totalPayouts,
                    2,
                    true,
                    true,
                );
                console.log('totalPayoutsFormatted: ', totalPayoutsFormatted);
                setRewardsEarned(totalPayoutsFormatted);
            })
            .catch((err) => console.error(err));

        fetch(
            `https://api.fuul.xyz/api/v1/payouts/leaderboard/points?user_identifier=${userDataStore.userAddress}&user_identifier_type=solana_address`,
            options,
        )
            .then((res) => res.json())
            .then((res) => setReferralData(res))
            .catch((err) => console.error(err));
    }, [userDataStore.userAddress]);

    // const referralCount = useMemo<string>(() => {
    //     try {
    //         return referralData?.results[0]?.total_amount.toString() || '0';
    //     } catch (err) {
    //         console.warn('Could not fetch referral data, error follows: ', err);
    //         return '...';
    //     }
    // }, [referralData]);

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
                <div className={styles.header_text}>
                    {t('referrals.title')}
                    <p>
                        {t('referrals.description')}{' '}
                        <a href='https://docs.ambient.finance/' target='_blank'>
                            {t('common.learnMore')}
                        </a>
                    </p>
                </div>
                <SimpleButton bg={'dark2'}>Register as Affiliate</SimpleButton>
            </header>
            <div className={styles.detailsContainer}>
                <div className={styles.detailsContent}>
                    <h6>{t('referrals.tradersReferred')}</h6>
                    <h3>{referralCount}</h3>
                </div>
                <div className={styles.detailsContent}>
                    <h6>{t('referrals.rewardsEarned')}</h6>
                    <h3>{rewardsEarned}</h3>
                </div>
            </div>
            <section className={styles.tableContainer}>
                <CodeTabs />
                <ReferralsTabs
                    payoutMovements={payoutMovements}
                    payoutsByReferrer={payoutsByReferrer}
                />
                <ReferralsExtra />
            </section>
        </div>
    );
}
