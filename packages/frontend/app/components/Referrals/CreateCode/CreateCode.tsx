import { SessionButton } from '@fogo/sessions-sdk-react';
import { Trans, useTranslation } from 'react-i18next';
import { FaCheck, FaRegCircle } from 'react-icons/fa';
import { GiCancel } from 'react-icons/gi';
import { LuCopy } from 'react-icons/lu';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import VolumeProgressBar from '../VolumeProgressBar/VolumeProgressBar';
import styles from './CreateCode.module.css';

interface PropsIF {
    isSessionEstablished: boolean;
    referrerCode: string;
    editModeReferrer: boolean;
    setEditModeReferrer: (value: boolean) => void;
    temporaryReferrerCode: string;
    setTemporaryReferrerCode: (value: string) => void;
    isTemporaryReferrerCodeValid: boolean | undefined;
    tempRefCodeCharsValidate: boolean;
    canEditReferrerCode: boolean;
    defaultReferrerCode: string;
    trackingLink: string;
    justCopied: boolean;
    setJustCopied: (value: boolean) => void;
    copy: (text: string) => void;
    totVolume: number | undefined;
    totVolumeFormatted: string;
    referrerEditVolumeThreshold: number;
    referrerPercent: string;
    inviteePercent: string;
    createRefCode: () => Promise<void>;
    updateRefCode: () => Promise<void>;
}

export default function CreateCode(props: PropsIF) {
    const {
        isSessionEstablished,
        referrerCode,
        editModeReferrer,
        setEditModeReferrer,
        temporaryReferrerCode,
        setTemporaryReferrerCode,
        isTemporaryReferrerCodeValid,
        tempRefCodeCharsValidate,
        canEditReferrerCode,
        defaultReferrerCode,
        trackingLink,
        justCopied,
        setJustCopied,
        copy,
        totVolume,
        totVolumeFormatted,
        referrerEditVolumeThreshold,
        referrerPercent,
        inviteePercent,
        createRefCode,
        updateRefCode,
    } = props;

    const { t } = useTranslation();

    if (!isSessionEstablished) {
        return (
            <section className={styles.sectionWithButton}>
                <div className={styles.enterCodeContent}>
                    <h6>{t('referrals.connectYourWallet.affiliate')}</h6>
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

    if (referrerCode && !editModeReferrer) {
        return (
            <section className={styles.sectionWithButton}>
                <div className={styles.createCodeContent}>
                    <p>
                        <Trans
                            i18nKey='referrals.yourCodeIs'
                            values={{ referrerCode }}
                            components={[
                                <span style={{ color: 'var(--accent3)' }} />,
                            ]}
                        />
                    </p>
                    <div
                        className={styles.with_copy_clipboard}
                        style={{
                            backgroundColor: justCopied
                                ? 'var(--green)'
                                : 'transparent',
                            transition: 'background-color 0.2s',
                            padding: 'var(--padding-s)',
                        }}
                        onClick={() => {
                            copy('https://' + trackingLink);
                            setJustCopied(true);
                        }}
                    >
                        {trackingLink && (
                            <div className={styles.walletLink}>
                                {trackingLink}
                            </div>
                        )}
                        <div className={styles.clipboard_wrapper}>
                            {justCopied ? (
                                <FaCheck size={14} />
                            ) : (
                                <LuCopy size={14} />
                            )}
                        </div>
                    </div>
                    <p className={styles.trackingLinkExplanation}>
                        <Trans
                            i18nKey='referrals.trackingLinkExplanation'
                            values={{
                                referrerPercent: referrerPercent,
                                inviteePercent: inviteePercent,
                            }}
                            components={[<span />, <span />]}
                        />
                    </p>
                    <p className={styles.trackingLinkExplanation}>
                        {t('referrals.toCustomizeAffiliateCode')}
                    </p>
                    <VolumeProgressBar
                        volume={totVolume ?? 0}
                        volumeFormatted={totVolumeFormatted}
                        barWidth={referrerEditVolumeThreshold}
                    />
                    <p className={styles.trackingLinkExplanation}>
                        {t('common.seeDocsForMore')}
                    </p>
                </div>
                {
                    <SimpleButton
                        bg='accent1'
                        onClick={() => {
                            setTemporaryReferrerCode(referrerCode);
                            setEditModeReferrer(true);
                        }}
                    >
                        {t('common.edit')}
                    </SimpleButton>
                }
            </section>
        );
    }

    return (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                {canEditReferrerCode ? (
                    <>
                        <h6>{t('referrals.createAnAffiliateCode')}</h6>
                        <input
                            type='text'
                            value={temporaryReferrerCode}
                            onChange={(e) => {
                                console.log(
                                    'Referral code input changed:',
                                    e.target.value,
                                );
                                setTemporaryReferrerCode(e.target.value);
                            }}
                            onKeyDown={async (e) => {
                                if (
                                    e.key === 'Enter' &&
                                    temporaryReferrerCode.trim()
                                ) {
                                    editModeReferrer
                                        ? updateRefCode()
                                        : createRefCode();
                                }
                            }}
                        />
                        <div className={styles.validation_item}>
                            {temporaryReferrerCode.length > 0 ? (
                                temporaryReferrerCode.length >= 2 &&
                                temporaryReferrerCode.length <= 30 &&
                                tempRefCodeCharsValidate ? (
                                    <FaCheck size={10} color='var(--green)' />
                                ) : (
                                    <GiCancel size={10} color='var(--red)' />
                                )
                            ) : (
                                <FaRegCircle size={10} color='var(--text3)' />
                            )}
                            <p>
                                2 - 30 letters, numbers, hyphens (A-Z, a-z, 0-9,
                                -)
                            </p>
                        </div>
                        <div className={styles.validation_item}>
                            {temporaryReferrerCode.length > 0 ? (
                                isTemporaryReferrerCodeValid === true ? (
                                    <FaCheck size={10} color='var(--green)' />
                                ) : (
                                    <GiCancel size={10} color='var(--red)' />
                                )
                            ) : (
                                <FaRegCircle size={10} color='var(--text3)' />
                            )}
                            <p>Code is available</p>
                        </div>
                        <h6>{t('referrals.createAUniqueCodeToEarn')}</h6>
                    </>
                ) : (
                    <>
                        <p>
                            <Trans
                                i18nKey='referrals.yourCodeIs'
                                values={{
                                    referrerCode:
                                        referrerCode ||
                                        defaultReferrerCode ||
                                        '—',
                                }}
                                components={[
                                    <span
                                        style={{ color: 'var(--accent3)' }}
                                    />,
                                ]}
                            />
                        </p>
                        <p>{t('referrals.toCustomizeAffiliateCode')}</p>
                    </>
                )}
                <VolumeProgressBar
                    volume={totVolume ?? 0}
                    volumeFormatted={totVolumeFormatted}
                    barWidth={referrerEditVolumeThreshold}
                />
            </div>
            <div className={styles.refferal_code_buttons}>
                <SimpleButton
                    bg='accent1'
                    onClick={() => {
                        if (editModeReferrer && canEditReferrerCode) {
                            void updateRefCode();
                        } else {
                            void createRefCode();
                        }
                    }}
                >
                    {t(editModeReferrer ? 'common.update' : 'common.activate')}
                </SimpleButton>
                {editModeReferrer && referrerCode && canEditReferrerCode && (
                    <SimpleButton
                        bg='dark4'
                        hoverBg='accent1'
                        onClick={() => {
                            setEditModeReferrer(false);
                            setTemporaryReferrerCode('');
                        }}
                    >
                        {t('common.cancel')}
                    </SimpleButton>
                )}
            </div>
        </section>
    );
}
