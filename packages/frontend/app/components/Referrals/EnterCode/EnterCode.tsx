import { SessionButton } from '@fogo/sessions-sdk-react';
import { Trans, useTranslation } from 'react-i18next';
import { FiEdit2 } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import styles from './EnterCode.module.css';

interface PropsIF {
    isSessionEstablished: boolean;
    totVolume: number | undefined;
    totVolumeFormatted: string;
    inviteeMaxVolumeThreshold: number;
    cached: string;
    isCachedValueValid: boolean | undefined;
    refCodeToConsume: string | undefined;
    editModeInvitee: boolean;
    setEditModeInvitee: (value: boolean) => void;
    userInputRefCode: string;
    setUserInputRefCode: (value: string) => void;
    isCheckingCode: boolean;
    isInputSolanaAddress: boolean;
    isUserRefCodeClaimed: boolean | undefined;
    isUserInputRefCodeSelfOwned: boolean | undefined;
    handleUpdateReferralCode: (code: string) => void;
    handleOverwriteReferralCode: (code: string) => void;
    openConfirmModal: () => void;
    setInvalidCode: (value: string) => void;
}

export default function EnterCode(props: PropsIF) {
    const {
        isSessionEstablished,
        totVolume,
        totVolumeFormatted,
        inviteeMaxVolumeThreshold,
        cached,
        isCachedValueValid,
        refCodeToConsume,
        editModeInvitee,
        setEditModeInvitee,
        userInputRefCode,
        setUserInputRefCode,
        isCheckingCode,
        isInputSolanaAddress,
        isUserRefCodeClaimed,
        isUserInputRefCodeSelfOwned,
        handleUpdateReferralCode,
        handleOverwriteReferralCode,
        openConfirmModal,
        setInvalidCode,
    } = props;

    const { t } = useTranslation();

    const isEligibleToEdit =
        totVolume !== undefined && totVolume < inviteeMaxVolumeThreshold;

    const handleCancelEdit = () => {
        setEditModeInvitee(false);
        setUserInputRefCode('');
        setInvalidCode('');
    };

    const isConfirmDisabled =
        userInputRefCode.length < 2 ||
        (!isInputSolanaAddress && userInputRefCode.length > 30) ||
        isCheckingCode ||
        !isUserRefCodeClaimed ||
        isUserInputRefCodeSelfOwned;

    const validationFeedback = userInputRefCode.length >= 2 && (
        <>
            {isInputSolanaAddress && !isUserInputRefCodeSelfOwned ? (
                <p
                    style={{
                        color: 'var(--text2)',
                        fontSize: 'var(--font-size-xs)',
                    }}
                >
                    This appears to be a wallet address. Please confirm with
                    your referrer that it is correct.
                </p>
            ) : (
                userInputRefCode.length <= 30 &&
                (isCheckingCode ? (
                    <p
                        style={{
                            color: 'var(--text2)',
                            fontSize: 'var(--font-size-xs)',
                        }}
                    >
                        Checking code...
                    </p>
                ) : isUserRefCodeClaimed ? (
                    <p
                        style={{
                            color: 'var(--positive)',
                            fontSize: 'var(--font-size-xs)',
                        }}
                    >
                        Code is valid!
                    </p>
                ) : (
                    <p style={{ fontSize: 'var(--font-size-xs)' }}>
                        <Trans
                            i18nKey='referrals.referralCodeNotValidPleaseConfirm'
                            values={{ invalidCode: userInputRefCode }}
                            components={[
                                <span style={{ color: 'var(--accent2)' }} />,
                            ]}
                        />
                    </p>
                ))
            )}
            {isUserInputRefCodeSelfOwned && (
                <p style={{ fontSize: 'var(--font-size-xs)' }}>
                    <Trans
                        i18nKey='referrals.doNotSelfRefer'
                        values={{ refCode: userInputRefCode }}
                        components={[
                            <span style={{ color: 'var(--accent2)' }} />,
                        ]}
                    />
                </p>
            )}
        </>
    );

    const currentCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <div className={styles.current_ref_code}>
                    <h6>{t('referrals.pendingRefCode')}</h6>
                    <div className={styles.codeWithIcon}>
                        {editModeInvitee ? (
                            <>
                                <input
                                    type='text'
                                    value={userInputRefCode}
                                    onChange={(e) =>
                                        setUserInputRefCode(e.target.value)
                                    }
                                    placeholder={t('referrals.clickToType', {
                                        defaultValue: 'click to type',
                                    })}
                                    autoFocus
                                />
                                <button
                                    type='button'
                                    className={styles.iconButton}
                                    onClick={handleCancelEdit}
                                    aria-label={t('common.cancel')}
                                >
                                    <IoClose size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                {cached && isCachedValueValid ? (
                                    <p>{refCodeToConsume}</p>
                                ) : (
                                    <p className={styles.placeholder}>
                                        {t('referrals.clickToType', {
                                            defaultValue: 'click to type',
                                        })}
                                    </p>
                                )}
                                {isEligibleToEdit && (
                                    <button
                                        type='button'
                                        className={styles.iconButton}
                                        onClick={() => {
                                            if (cached) {
                                                setUserInputRefCode(cached);
                                            }
                                            setEditModeInvitee(true);
                                        }}
                                        aria-label={t('common.edit')}
                                    >
                                        <FiEdit2 size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <p className={styles.ref_code_blurb}>
                    Associating a code with your wallet address will register
                    you to earn rewards on your transactions. Rewards will also
                    be paid to the user who created the code.
                </p>
                {editModeInvitee && validationFeedback}
                {!editModeInvitee && isCachedValueValid === false && (
                    <p>
                        This code does not appear to be registered in the
                        referral system.
                    </p>
                )}
            </div>
            {isEligibleToEdit && (
                <SimpleButton
                    bg='accent1'
                    disabled={
                        editModeInvitee
                            ? isConfirmDisabled
                            : !(cached && isCachedValueValid)
                    }
                    onClick={() => {
                        if (editModeInvitee && !isConfirmDisabled) {
                            handleOverwriteReferralCode(userInputRefCode);
                        } else {
                            openConfirmModal();
                        }
                    }}
                >
                    {t('common.confirm')}
                </SimpleButton>
            )}
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
    if (totVolume && totVolume >= inviteeMaxVolumeThreshold) {
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

    return currentCodeElem;
}
