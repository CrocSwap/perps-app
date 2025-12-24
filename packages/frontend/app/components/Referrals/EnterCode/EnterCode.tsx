import { SessionButton } from '@fogo/sessions-sdk-react';
import { Trans, useTranslation } from 'react-i18next';
import { FaSpinner } from 'react-icons/fa';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import styles from './EnterCode.module.css';

interface PropsIF {
    isSessionEstablished: boolean;
    totVolume: number | undefined;
    totVolumeFormatted: string;
    cached: string;
    isCachedValueValid: boolean | undefined;
    refCodeToConsume: string | undefined;
    editModeReferral: boolean;
    setEditModeReferral: (value: boolean) => void;
    userInputRefCode: string;
    setUserInputRefCode: (value: string) => void;
    isUserRefCodeClaimed: boolean | undefined;
    isUserInputRefCodeSelfOwned: boolean | undefined;
    handleUpdateReferralCode: (code: string) => void;
    setInvalidCode: (value: string) => void;
}

export default function EnterCode(props: PropsIF) {
    const {
        isSessionEstablished,
        totVolume,
        totVolumeFormatted,
        cached,
        isCachedValueValid,
        refCodeToConsume,
        editModeReferral,
        setEditModeReferral,
        userInputRefCode,
        setUserInputRefCode,
        isUserRefCodeClaimed,
        isUserInputRefCodeSelfOwned,
        handleUpdateReferralCode,
        setInvalidCode,
    } = props;

    const { t } = useTranslation();

    const spinner = (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
            }}
        >
            <FaSpinner
                style={{
                    color: 'var(--accent1)',
                    animation: 'spin 0.6s linear infinite',
                }}
            />
        </div>
    );

    const currentCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                {cached ? (
                    <>
                        <div className={styles.current_ref_code}>
                            <h6>{t('referrals.usingAffiliateCode')}</h6>
                            {isCachedValueValid && <p>{refCodeToConsume}</p>}
                        </div>
                        <p className={styles.ref_code_blurb}>
                            Associating a code with your wallet address will
                            register you to earn rewards on your transactions.
                            Rewards will also be paid to the affiliate who
                            created the code.
                        </p>
                        {isCachedValueValid === false && (
                            <p>
                                This code does not appear to be registered in
                                the referral system.
                            </p>
                        )}
                    </>
                ) : (
                    <h6>{t('referrals.enterCode')}</h6>
                )}
            </div>
            {cached && totVolume !== undefined && totVolume < 10000 && (
                <div className={styles.refferal_code_buttons}>
                    <SimpleButton
                        bg='accent1'
                        onClick={() => setEditModeReferral(true)}
                    >
                        {t('common.edit')}
                    </SimpleButton>
                </div>
            )}
        </section>
    );

    const enterNewCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>
                    {cached
                        ? t('referrals.overwriteCurrentReferralCode') + ': '
                        : t('referrals.enterReferralCode') + ': '}
                    <span style={{ color: 'var(--accent3)' }}>{cached}</span>
                </h6>
                <input
                    type='text'
                    value={userInputRefCode}
                    onChange={(e) => setUserInputRefCode(e.target.value)}
                />
                {!isUserRefCodeClaimed &&
                    userInputRefCode.length <= 30 &&
                    userInputRefCode.length >= 2 && (
                        <p>
                            <Trans
                                i18nKey='referrals.referralCodeNotValidPleaseConfirm'
                                values={{ invalidCode: userInputRefCode }}
                                components={[
                                    <span
                                        style={{ color: 'var(--accent2)' }}
                                    />,
                                ]}
                            />
                        </p>
                    )}
                {isUserInputRefCodeSelfOwned && (
                    <p>
                        <Trans
                            i18nKey='referrals.doNotSelfRefer'
                            values={{ affiliateCode: userInputRefCode }}
                            components={[
                                <span style={{ color: 'var(--accent2)' }} />,
                            ]}
                        />
                    </p>
                )}
            </div>
            <div className={styles.refferal_code_buttons}>
                <SimpleButton
                    bg='accent1'
                    disabled={
                        userInputRefCode.length < 2 ||
                        userInputRefCode.length > 30 ||
                        !isUserRefCodeClaimed ||
                        isUserInputRefCodeSelfOwned
                    }
                    onClick={(): void => {
                        handleUpdateReferralCode(userInputRefCode);
                    }}
                >
                    {t('common.confirm')}
                </SimpleButton>
                {cached && isCachedValueValid && (
                    <SimpleButton
                        bg='dark3'
                        hoverBg='accent1'
                        onClick={() => {
                            setEditModeReferral(false);
                            setInvalidCode('');
                        }}
                    >
                        {t('common.cancel')}
                    </SimpleButton>
                )}
            </div>
        </section>
    );

    // Not connected state
    if (!isSessionEstablished) {
        return (
            <section className={styles.sectionWithButton}>
                <div className={styles.enterCodeContent}>
                    <h6>{t('referrals.connectYourWallet.enterCode')}</h6>
                </div>
                <div
                    className={styles.sessionButtonWrapper}
                    style={{ height: '100%' }}
                >
                    <SessionButton />
                </div>
            </section>
        );
    }

    // Only show content/error when volume is available
    if (totVolume && totVolume > 10000) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'var(--text2)',
                    padding: 'var(--padding-m, 16px)',
                    textAlign: 'center',
                    lineHeight: '1.5',
                }}
            >
                This wallet has logged {totVolumeFormatted} in trading volume.
                Only users with less than $10,000 in trading volume can enter a
                referral code.
            </div>
        );
    }

    const shouldShowInput =
        (editModeReferral || !cached || isCachedValueValid === false) &&
        totVolume !== undefined &&
        totVolume < 10000;

    return shouldShowInput ? enterNewCodeElem : currentCodeElem;
}
