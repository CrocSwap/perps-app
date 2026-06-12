export type ConnectWalletRefregGateInput = {
    isSessionEstablished: boolean;
    hasSendTransaction: boolean;
    hasWalletPublicKey: boolean;
    hasSessionPublicKey: boolean;
    hasPayerPublicKey: boolean;
    hasCachedReferralCode: boolean;
    isCachedReferralCodeApproved: boolean;
};

export type ConnectWalletRefregGateResult =
    | { shouldRun: true }
    | {
          shouldRun: false;
          reason:
              | 'session_not_established'
              | 'send_transaction_unavailable'
              | 'missing_wallet_or_session_pubkey'
              | 'missing_payer_pubkey'
              | 'referral_not_approved';
      };

export function getConnectWalletRefregGate(
    input: ConnectWalletRefregGateInput,
): ConnectWalletRefregGateResult {
    if (!input.isSessionEstablished) {
        return { shouldRun: false, reason: 'session_not_established' };
    }
    if (!input.hasSendTransaction) {
        return { shouldRun: false, reason: 'send_transaction_unavailable' };
    }
    if (!input.hasWalletPublicKey || !input.hasSessionPublicKey) {
        return {
            shouldRun: false,
            reason: 'missing_wallet_or_session_pubkey',
        };
    }
    if (!input.hasPayerPublicKey) {
        return { shouldRun: false, reason: 'missing_payer_pubkey' };
    }
    if (!input.hasCachedReferralCode || !input.isCachedReferralCodeApproved) {
        return { shouldRun: false, reason: 'referral_not_approved' };
    }
    return { shouldRun: true };
}

export function getConnectWalletSubmissionKey(
    fingerprint: string,
    approvalNonce: number,
): string {
    return `${fingerprint}:${approvalNonce}`;
}
