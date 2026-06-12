import { describe, expect, it } from 'vitest';
import {
    getConnectWalletRefregGate,
    getConnectWalletSubmissionKey,
} from './connectWalletRefregGate';

describe('connect wallet refreg gate', () => {
    const readyInput = {
        isSessionEstablished: true,
        hasSendTransaction: true,
        hasWalletPublicKey: true,
        hasSessionPublicKey: true,
        hasPayerPublicKey: true,
        hasCachedReferralCode: true,
        isCachedReferralCodeApproved: true,
    };

    it('allows the connect-wallet flow only when every prerequisite is present', () => {
        expect(getConnectWalletRefregGate(readyInput)).toEqual({
            shouldRun: true,
        });
    });

    it.each([
        ['isSessionEstablished', 'session_not_established'],
        ['hasSendTransaction', 'send_transaction_unavailable'],
        ['hasWalletPublicKey', 'missing_wallet_or_session_pubkey'],
        ['hasSessionPublicKey', 'missing_wallet_or_session_pubkey'],
        ['hasPayerPublicKey', 'missing_payer_pubkey'],
        ['hasCachedReferralCode', 'referral_not_approved'],
        ['isCachedReferralCodeApproved', 'referral_not_approved'],
    ] as const)('blocks when %s is false', (key, reason) => {
        expect(
            getConnectWalletRefregGate({
                ...readyInput,
                [key]: false,
            }),
        ).toEqual({ shouldRun: false, reason });
    });

    it('keys duplicate suppression by instruction fingerprint and approval nonce', () => {
        expect(getConnectWalletSubmissionKey('abc', 3)).toBe('abc:3');
    });
});
