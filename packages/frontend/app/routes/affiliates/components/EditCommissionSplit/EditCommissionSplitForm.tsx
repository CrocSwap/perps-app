import { useState } from 'react';
import { Fuul, UserIdentifierType } from '@fuul/sdk';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useCommissionSplit } from '../../hooks/useCommissionSplit';
import styles from './EditCommissionSplit.module.css';

interface EditCommissionSplitFormProps {
    code: string;
    currentSplit: number;
    onSuccess: () => void;
    onCancel: () => void;
    commissionRate?: number;
}

export default function EditCommissionSplitForm({
    code,
    currentSplit,
    onSuccess,
    onCancel,
    commissionRate,
}: EditCommissionSplitFormProps) {
    const sessionState = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initialSliderValue = commissionRate
        ? Math.round(((commissionRate - currentSplit) / commissionRate) * 100)
        : 100;

    const {
        sliderValue,
        setSliderValue,
        hasValidCommissionRate,
        inviteePercentage,
        youAmount,
        inviteeAmount,
        sliderStep,
    } = useCommissionSplit({
        commissionRate,
        initialSliderValue,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

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
            const message = `I confirm that I am updating my code to ${code.toLowerCase()} on Fuul`;
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes =
                await sessionState.solanaWallet.signMessage(messageBytes);

            const signatureArray = Array.from(new Uint8Array(signatureBytes));
            const binaryString = String.fromCharCode.apply(
                null,
                signatureArray,
            );
            const signature = btoa(binaryString);

            await Fuul.updateAffiliateCode({
                userIdentifier: userWalletKey.toString(),
                identifierType: UserIdentifierType.SolanaAddress,
                code: code.toLowerCase(),
                signature,
                signaturePublicKey: userWalletKey.toString(),
                userRebateRate: Number((inviteeAmount / 100).toFixed(2)),
            });

            window.dispatchEvent(new CustomEvent('affiliateDataUpdate'));
            onSuccess();
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to update commission split';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.headerSection}>
                <label className={styles.label}>
                    Edit split commission ratio for{' '}
                    <span className={styles.codeHighlight}>{code}</span>
                </label>
                <p className={styles.subtext}>
                    {hasValidCommissionRate
                        ? `Your commission level is ${commissionRate}%`
                        : 'Commission level not available'}
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
                    disabled={isSubmitting || !hasValidCommissionRate}
                    className={styles.submitButton}
                >
                    {isSubmitting ? 'Updating...' : 'Update'}
                </button>
            </div>
        </form>
    );
}
