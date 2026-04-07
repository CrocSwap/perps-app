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
import { useRefCodeModalStore } from '~/stores/RefCodeModalStore';
import { useReferralStore } from '~/stores/ReferralStore';
import { FUUL_KEYS } from '~/components/Referrals/referralKeys';

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
    const refCodeModalStore = useRefCodeModalStore();
    const referralStore = useReferralStore();

    const handleOpenRefCodeModal = () => {
        const code = referralStore.cached.code;
        if (code) {
            refCodeModalStore.openModal(code);
        }
    };

    const [referralData, setReferralData] = useState<any>(null);

    const { formatNum } = useNumFormatter();

    const [rewardsEarned, setRewardsEarned] = useState<string>('...');

    const [inviteeCount, setInviteeCount] = useState<string>('...');

    const [payoutMovements, setPayoutMovements] = useState<PayoutMovementIF[]>(
        [],
    );
    useEffect(() => {
        console.log(
            '🔍 [Referrals] Starting payout movements query for address:',
            userDataStore.userAddress,
        );

        if (!userDataStore.userAddress) {
            console.log(
                '🔍 [Referrals] No user address, clearing payout movements',
            );
            setPayoutMovements([]);
            return;
        }

        const OPTIONS = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization: `Bearer ${FUUL_GET_API_KEY}`,
            },
        };

        const queryUrl = `https://api.fuul.xyz/api/v1/payouts/movements?user_identifier=${userDataStore.userAddress}&identifier_type=solana_address&type=point`;
        console.log(
            '🔍 [Referrals] Executing payout movements query:',
            queryUrl,
        );

        fetch(queryUrl, OPTIONS)
            .then((res) => {
                console.log(
                    '🔍 [Referrals] Payout movements query response status:',
                    res.status,
                );
                return res.json();
            })
            .then((res: PayoutMovementsResponseIF) => {
                console.log(
                    '🔍 [Referrals] Payout movements query results count:',
                    res.results?.length ?? 0,
                );
                setPayoutMovements(res.results ?? []);
            })
            .catch((err) => {
                console.error(
                    '❌ [Referrals] Payout movements query error:',
                    err,
                );
                setPayoutMovements([]);
            });
    }, [userDataStore.userAddress]);

    const [payoutsByReferrer, setPayoutsByReferrer] = useState<
        PayoutByReferrerT[]
    >([]);

    useEffect(() => {
        referralStore.fetchClaims(userDataStore.userAddress ?? '');
    }, [userDataStore.userAddress]);

    useEffect(() => {
        referralStore.fetchRewardHistory(
            userDataStore.userAddress ?? '',
            FUUL_KEYS.NON_PERMISSIONED.READ_ONLY,
        );
    }, [userDataStore.userAddress]);

    useEffect(() => {
        console.log(
            '🔍 [Referrals] Starting payouts by referrer query for address:',
            userDataStore.userAddress,
        );

        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization:
                    'Bearer 7010050cc4b7274037a80fd9119bce3567ce7443d163c097c787a39dac341870',
            },
        };

        if (!userDataStore.userAddress) {
            console.log(
                '🔍 [Referrals] No user address, clearing payouts data',
            );
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

        const queryUrl = `https://api.fuul.xyz/api/v1/payouts/by-referrer?user_identifier=${userDataStore.userAddress}&user_identifier_type=solana_address`;
        console.log(
            '🔍 [Referrals] Executing payouts by referrer query:',
            queryUrl,
        );

        fetch(queryUrl, optionsPayouts)
            .then((res) => {
                console.log(
                    '🔍 [Referrals] Payouts by referrer query response status:',
                    res.status,
                );
                return res.json();
            })
            .then((res) => {
                if (!Array.isArray(res)) {
                    console.error(
                        '❌ [Referrals] payouts/by-referrer query returned non-array:',
                        typeof res,
                    );
                    setPayoutsByReferrer([]);
                    setInviteeCount('0');
                    setRewardsEarned('$0.00');
                    return;
                }

                console.log(
                    '✅ [Referrals] Payouts by referrer query results count:',
                    res.length,
                );
                setPayoutsByReferrer(res);
                setInviteeCount(res.length.toString());

                const totalPayouts: number = res.reduce(
                    (acc: number, payout: any) => {
                        const payoutValue = Object.values(payout)[0] as any;
                        const volume = payoutValue?.volume || 0;
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
                console.log(
                    '✅ [Referrals] Total payouts calculated:',
                    totalPayoutsFormatted,
                );
                setRewardsEarned(totalPayoutsFormatted);
            })
            .catch((err) => {
                console.error(
                    '❌ [Referrals] Payouts by referrer query error:',
                    err,
                );
                setPayoutsByReferrer([]);
                setInviteeCount('0');
                setRewardsEarned('$0.00');
            });

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
                    <div className={styles.description_row}>
                        <p>
                            {t('referrals.description')}{' '}
                            <a
                                href='https://docs.ambient.finance/'
                                target='_blank'
                            >
                                {t('common.learnMore')}
                            </a>
                        </p>
                        <a
                            href='/v2/affiliates'
                            className={styles.partner_link}
                        >
                            Become a Partner
                        </a>
                    </div>
                </div>
                <SimpleButton bg={'dark2'} onClick={handleOpenRefCodeModal}>
                    Register for the Referral Program
                </SimpleButton>
            </header>
            <div className={styles.detailsContainer}>
                <div className={styles.detailsContent}>
                    <h6>{t('referrals.tradersReferred')}</h6>
                    <h3>{inviteeCount}</h3>
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
