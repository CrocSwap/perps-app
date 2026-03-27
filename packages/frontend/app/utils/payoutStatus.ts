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

export const PAYOUT_STATUS_LABELS = {
    pending_recipient_acceptance: 'Needs User Acceptance',
    pending_approval: 'Needs Admin Approval',
    pending_transaction: 'Awaiting Transaction',
    sending_transaction: 'Sending Transaction',
    pending_confirmation: 'Awaiting Confirmation',
    confirmed: 'Confirmed',
    failed: 'Failed',
    rejected: 'Rejected',
    deferred: 'Deferred',
    pending_process_approval: 'Awaiting Process Approval',
    processing_approval: 'Processing Approval',
} as const satisfies Record<PayoutStatusServerValueT, string>;

export type PayoutStatusLabelT =
    (typeof PAYOUT_STATUS_LABELS)[keyof typeof PAYOUT_STATUS_LABELS];

export const getPayoutStatusLabel = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    return (
        PAYOUT_STATUS_LABELS[normalizedStatus as PayoutStatusServerValueT] ??
        status
    );
};
