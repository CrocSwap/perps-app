import { useMemo } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { IoChevronDown, IoCopy } from 'react-icons/io5';
import { useSearchParams } from 'react-router';
import { FaTelegramPlane } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useUserDataStore } from '~/stores/UserDataStore';
import {
    useAffiliateAudience,
    useAffiliateCode,
} from '../hooks/useAffiliateData';
import {
    getAffiliateLevelByAudienceId,
    getCommissionByAudienceId,
} from '../utils/affiliate-levels';
import { DashboardTab } from './TabController';
import styles from '../affiliates.module.css';

export function AffiliateCurrentLevelCard() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();
    const [, setSearchParams] = useSearchParams();

    const { data: audienceData } = useAffiliateAudience(
        userAddress || '',
        isConnected && !!userAddress,
    );

    const {
        data: affiliateCode,
        isLoading: isLoadingCode,
        error: affiliateCodeError,
    } = useAffiliateCode(userAddress || '', isConnected && !!userAddress);

    const audienceId = audienceData?.audiences?.results?.[0]?.id;

    const level = useMemo(() => {
        if (!audienceId) return null;
        return getAffiliateLevelByAudienceId(audienceId) ?? null;
    }, [audienceId]);

    const commissionRatePercent = useMemo(() => {
        if (!audienceId) return null;
        const commission = getCommissionByAudienceId(audienceId);
        if (commission === undefined) return null;
        return commission * 100;
    }, [audienceId]);

    const inviteePercent = (affiliateCode?.user_rebate_rate ?? 0) * 100;
    const youPercent = useMemo(() => {
        if (commissionRatePercent === null) return null;
        const raw = commissionRatePercent - inviteePercent;
        return raw < 0 ? 0 : raw;
    }, [commissionRatePercent, inviteePercent]);

    const code = affiliateCode?.code ?? '';
    const referralUrl = code ? `${window.location.origin}?af=${code}` : '';

    const copyToClipboard = async (value: string) => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
    };

    const openShare = (platform: 'x' | 'telegram') => {
        if (!referralUrl) return;
        const url =
            platform === 'x'
                ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}`
                : `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className={`${styles['stat-card']} ${styles['current-level-card']}`}
        >
            <div className={styles['current-level-header']}>
                <div>
                    <div className={styles['current-level-title']}>
                        Affiliate Current Level
                    </div>
                    <div className={styles['current-level-subtitle']}>
                        {level?.name ?? '-'}
                    </div>
                </div>

                <button
                    type='button'
                    className={`${styles.btn} ${styles['btn-secondary']}`}
                    onClick={() =>
                        setSearchParams({ view: DashboardTab.Links })
                    }
                >
                    Manage referral codes
                </button>
            </div>

            <div className={styles['current-level-metrics']}>
                <div>
                    <div className={styles['current-level-metric-label']}>
                        Level Commission
                    </div>
                    <div className={styles['current-level-metric-value']}>
                        {commissionRatePercent !== null
                            ? `${commissionRatePercent.toFixed(0)}%`
                            : '-'}
                    </div>
                </div>

                <div>
                    <div className={styles['current-level-metric-label']}>
                        Commission Split
                    </div>
                    <div className={styles['current-level-metric-value']}>
                        {youPercent !== null
                            ? `${youPercent.toFixed(0)}% / ${inviteePercent.toFixed(0)}%`
                            : '-'}
                    </div>
                    <div className={styles['current-level-metric-hint']}>
                        For you / For invitee
                    </div>
                </div>
            </div>

            <div>
                <div className={styles['current-level-field-row']}>
                    <div className={styles['current-level-field']}>
                        <span className={styles['current-level-field-text']}>
                            {code || (isLoadingCode ? 'Loading…' : '-')}
                        </span>
                        <IoChevronDown
                            size={16}
                            color={'var(--aff-text-muted)'}
                        />
                    </div>
                    <button
                        type='button'
                        className={styles['pagination-button']}
                        onClick={() => copyToClipboard(code)}
                        disabled={!code}
                        aria-label='Copy referral code'
                    >
                        <IoCopy size={16} />
                    </button>
                </div>

                <div
                    className={styles['current-level-field-row']}
                    style={{ marginTop: '0.75rem' }}
                >
                    <div className={styles['current-level-field']}>
                        <span className={styles['current-level-field-text']}>
                            {referralUrl || (isLoadingCode ? 'Loading…' : '-')}
                        </span>
                    </div>
                    <button
                        type='button'
                        className={styles['pagination-button']}
                        onClick={() => copyToClipboard(referralUrl)}
                        disabled={!referralUrl}
                        aria-label='Copy referral link'
                    >
                        <IoCopy size={16} />
                    </button>
                </div>
            </div>

            <div className={styles['current-level-share']}>
                <div className={styles['current-level-share-label']}>
                    Share on
                </div>
                <div className={styles['current-level-share-buttons']}>
                    <button
                        type='button'
                        className={styles['current-level-share-button']}
                        onClick={() => openShare('x')}
                        disabled={!referralUrl}
                        aria-label='Share on X'
                    >
                        <FaXTwitter size={14} />
                    </button>
                    <button
                        type='button'
                        className={styles['current-level-share-button']}
                        onClick={() => openShare('telegram')}
                        disabled={!referralUrl}
                        aria-label='Share on Telegram'
                    >
                        <FaTelegramPlane size={14} />
                    </button>
                </div>
            </div>

            {affiliateCodeError && (
                <div
                    style={{
                        fontSize: '0.875rem',
                        color: 'var(--aff-negative)',
                    }}
                >
                    {affiliateCodeError instanceof Error
                        ? affiliateCodeError.message
                        : 'Failed to load referral code'}
                </div>
            )}
        </div>
    );
}
