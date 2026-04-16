export type PayoutStatusServerValueT =
    | 'pending_recipient_acceptance'
    | 'pending_approval'
    | 'pending_transaction'
    | 'sending_transaction'
    | 'pending_confirmation'
    | 'confirmed'
    | 'failed'
    | 'rejected'
    | 'deferred'
    | 'pending_process_approval'
    | 'processing_approval';

export const PAYOUT_STATUS_TRANSLATION_KEYS = {
    pending_recipient_acceptance:
        'referrals.payoutStatus.pending_recipient_acceptance',
    pending_approval: 'referrals.payoutStatus.pending_approval',
    pending_transaction: 'referrals.payoutStatus.pending_transaction',
    sending_transaction: 'referrals.payoutStatus.sending_transaction',
    pending_confirmation: 'referrals.payoutStatus.pending_confirmation',
    confirmed: 'referrals.payoutStatus.confirmed',
    failed: 'referrals.payoutStatus.failed',
    rejected: 'referrals.payoutStatus.rejected',
    deferred: 'referrals.payoutStatus.deferred',
    pending_process_approval: 'referrals.payoutStatus.pending_process_approval',
    processing_approval: 'referrals.payoutStatus.processing_approval',
} as const satisfies Record<PayoutStatusServerValueT, string>;

export type PayoutStatusTranslationKeyT =
    (typeof PAYOUT_STATUS_TRANSLATION_KEYS)[keyof typeof PAYOUT_STATUS_TRANSLATION_KEYS];

export type PayoutStatusTranslatorT = (
    key: string,
    options?: { defaultValue?: string },
) => string;

export const getPayoutStatusTranslationKey = (
    status: string,
): PayoutStatusTranslationKeyT | undefined => {
    const normalizedStatus = status.toLowerCase();
    return (
        PAYOUT_STATUS_TRANSLATION_KEYS[
            normalizedStatus as PayoutStatusServerValueT
        ] ?? undefined
    );
};

export default function mapPayoutStatusText(
    t: PayoutStatusTranslatorT,
    status: string,
): string {
    const translationKey = getPayoutStatusTranslationKey(status);

    if (!translationKey) {
        console.error(
            `[payoutStatus] Missing translation key for status: ${status}`,
        );
        return status;
    }

    try {
        return t(translationKey, { defaultValue: status });
    } catch (error) {
        console.error(
            `[payoutStatus] Failed to resolve label for status: ${status}`,
            error,
        );
        return status;
    }
}
