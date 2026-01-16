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
    affiliateCode: string;
    editModeAffiliate: boolean;
    setEditModeAffiliate: (value: boolean) => void;
    temporaryAffiliateCode: string;
    setTemporaryAffiliateCode: (value: string) => void;
    isTemporaryAffiliateCodeValid: boolean | undefined;
    tempAffiliateCodeCharsValidate: boolean;
    canEditAffiliateCode: boolean;
    defaultAffiliateCode: string;
    trackingLink: string;
    justCopied: boolean;
    setJustCopied: (value: boolean) => void;
    copy: (text: string) => void;
    totVolume: number | undefined;
    totVolumeFormatted: string;
    affiliateEditVolumeThreshold: number;
    affiliatePercent: string;
    userPercent: string;
    createAffiliateCode: () => Promise<void>;
    updateAffiliateCode: () => Promise<void>;
}

export default function CreateCode(props: PropsIF) {
    const {
        isSessionEstablished,
        affiliateCode,
        editModeAffiliate,
        setEditModeAffiliate,
        temporaryAffiliateCode,
        setTemporaryAffiliateCode,
        isTemporaryAffiliateCodeValid,
        tempAffiliateCodeCharsValidate,
        canEditAffiliateCode,
        defaultAffiliateCode,
        trackingLink,
        justCopied,
        setJustCopied,
        copy,
        totVolume,
        totVolumeFormatted,
        affiliateEditVolumeThreshold,
        affiliatePercent,
        userPercent,
        createAffiliateCode,
        updateAffiliateCode,
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

    if (affiliateCode && !editModeAffiliate) {
        return (
            <section className={styles.sectionWithButton}>
                <div className={styles.createCodeContent}>
                    <p>
                        <Trans
                            i18nKey='referrals.yourCodeIs'
                            values={{ affiliateCode }}
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
                                affiliatePercent: affiliatePercent,
                                userPercent: userPercent,
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
                        barWidth={affiliateEditVolumeThreshold}
                    />
                    <p className={styles.trackingLinkExplanation}>
                        {t('common.seeDocsForMore')}
                    </p>
                </div>
                {
                    <SimpleButton
                        bg='accent1'
                        onClick={() => {
                            setTemporaryAffiliateCode(affiliateCode);
                            setEditModeAffiliate(true);
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
                {canEditAffiliateCode ? (
                    <>
                        <h6>{t('referrals.createAnAffiliateCode')}</h6>
                        <input
                            type='text'
                            value={temporaryAffiliateCode}
                            onChange={(e) => {
                                console.log(
                                    'Affiliate code input changed:',
                                    e.target.value,
                                );
                                setTemporaryAffiliateCode(e.target.value);
                            }}
                            onKeyDown={async (e) => {
                                if (
                                    e.key === 'Enter' &&
                                    temporaryAffiliateCode.trim()
                                ) {
                                    editModeAffiliate
                                        ? updateAffiliateCode()
                                        : createAffiliateCode();
                                }
                            }}
                        />
                        <div className={styles.validation_item}>
                            {temporaryAffiliateCode.length > 0 ? (
                                temporaryAffiliateCode.length >= 2 &&
                                temporaryAffiliateCode.length <= 30 &&
                                tempAffiliateCodeCharsValidate ? (
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
                            {temporaryAffiliateCode.length > 0 ? (
                                isTemporaryAffiliateCodeValid === true ? (
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
                                    affiliateCode:
                                        affiliateCode ||
                                        defaultAffiliateCode ||
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
                    barWidth={affiliateEditVolumeThreshold}
                />
            </div>
            <div className={styles.refferal_code_buttons}>
                <SimpleButton
                    bg='accent1'
                    onClick={() => {
                        if (editModeAffiliate && canEditAffiliateCode) {
                            void updateAffiliateCode();
                        } else {
                            void createAffiliateCode();
                        }
                    }}
                >
                    {t(editModeAffiliate ? 'common.update' : 'common.activate')}
                </SimpleButton>
                {editModeAffiliate && affiliateCode && canEditAffiliateCode && (
                    <SimpleButton
                        bg='dark4'
                        hoverBg='accent1'
                        onClick={() => {
                            setEditModeAffiliate(false);
                            setTemporaryAffiliateCode('');
                        }}
                    >
                        {t('common.cancel')}
                    </SimpleButton>
                )}
            </div>
        </section>
    );
}
