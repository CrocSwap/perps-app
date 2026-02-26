import { useState } from 'react';
import { Fuul, UserIdentifierType } from '@fuul/sdk';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useCommissionSplit } from '../../hooks/useCommissionSplit';
import styles from './CreateReferralCode.module.css';

interface CreateReferralCodeFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    commissionRate?: number;
}

export default function CreateReferralCodeForm({
    onSuccess,
    onCancel,
    commissionRate,
}: CreateReferralCodeFormProps) {
    const sessionState = useSession();
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        sliderValue,
        setSliderValue,
        hasValidCommissionRate,
        inviteePercentage,
        youAmount,
        inviteeAmount,
        sliderStep,
    } = useCommissionSplit({ commissionRate });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!code) {
            setError('Please enter a referral code');
            return;
        }

        if (code.length < 5 || code.length > 12) {
            setError('Code must be between 5-12 characters');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(code)) {
            setError(
                'Code can only contain lowercase letters, numbers, and dashes',
            );
            return;
        }

        if (!isEstablished(sessionState)) {
            setError('Please connect your wallet');
            return;
        }

        const userWalletKey =
            sessionState.walletPublicKey || sessionState.sessionPublicKey;

        if (!userWalletKey || !sessionState.solanaWallet?.signMessage) {
            setError('Please connect your wallet');
            return;
        }

        setIsSubmitting(true);

        try {
            // Check if code is available before proceeding
            const isCodeFree = await Fuul.isAffiliateCodeFree(code);
            if (!isCodeFree) {
                setError(
                    'This code is already taken. Please choose a different one.',
                );
                setIsSubmitting(false);
                return;
            }

            const message = `I confirm that I am creating the ${code} code`;
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes =
                await sessionState.solanaWallet.signMessage(messageBytes);

            const signatureArray = Array.from(new Uint8Array(signatureBytes));
            const binaryString = String.fromCharCode.apply(
                null,
                signatureArray,
            );
            const signature = btoa(binaryString);

            await Fuul.createAffiliateCode({
                userIdentifier: userWalletKey.toString(),
                identifierType: UserIdentifierType.SolanaAddress,
                code,
                signature,
                signaturePublicKey: userWalletKey.toString(),
                ...(hasValidCommissionRate && {
                    userRebateRate: Number((inviteeAmount / 100).toFixed(2)),
                }),
            });

            window.dispatchEvent(new CustomEvent('affiliateDataUpdate'));
            onSuccess();
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to create referral code';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.headerSection}>
                <label className={styles.label}>
                    Set split commission ratio{' '}
                    {hasValidCommissionRate
                        ? `(Your commission level is ${commissionRate}%)`
                        : ''}
                </label>
                <p className={styles.subtext}>
                    The commission ratio can be edited once it has been saved.
                </p>
            </div>

            <div className={styles.sliderSection}>
                <input
                    type='range'
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    min={50}
                    max={100}
                    step={sliderStep}
                    className={styles.slider}
                    disabled={!hasValidCommissionRate}
                />
                <div className={styles.sliderLabels}>
                    <span>
                        You{' '}
                        {hasValidCommissionRate
                            ? `${youAmount.toFixed(1)}%`
                            : '-'}
                    </span>
                    <span>
                        Invitee{' '}
                        {hasValidCommissionRate
                            ? `${inviteeAmount.toFixed(1)}%`
                            : '-'}
                    </span>
                </div>
            </div>

            <div className={styles.inputSection}>
                <label htmlFor='code' className={styles.label}>
                    Custom Referral Code
                </label>
                <input
                    id='code'
                    type='text'
                    value={code}
                    onChange={(e) => setCode(e.target.value.toLowerCase())}
                    placeholder='Enter 5-12 characters'
                    maxLength={12}
                    className={styles.input}
                />
                <p className={styles.subtext}>
                    Code can be lowercase letters, numbers, or dashes.
                </p>
            </div>

            {error && <div className={styles.errorText}>{error}</div>}

            <div className={styles.actionButtons}>
                <button
                    type='button'
                    onClick={onCancel}
                    className={styles.cancelButton}
                >
                    Cancel
                </button>
                <button
                    type='submit'
                    disabled={isSubmitting}
                    className={styles.submitButton}
                >
                    {isSubmitting ? 'Creating...' : 'Create'}
                </button>
            </div>
        </form>
    );
}
