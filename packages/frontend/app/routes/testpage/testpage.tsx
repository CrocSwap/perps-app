import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useReferralStore } from '~/stores/ReferralStore';

export default function testpage() {
    const sessionState = useSession();
    const referralStore = useReferralStore();

    const handleClick = () => {
        if (!isEstablished(sessionState)) {
            console.warn('Session not established');
            return;
        }

        const userWalletKey =
            sessionState.walletPublicKey || sessionState.sessionPublicKey;

        if (!userWalletKey) {
            console.warn('No wallet key available');
            return;
        }

        console.info('[refreg] frontend FUUL event posting is disabled', {
            wallet: userWalletKey.toString(),
            referralCode: referralStore.cached.code,
        });
    };

    const userWalletKey = isEstablished(sessionState)
        ? sessionState.walletPublicKey || sessionState.sessionPublicKey
        : null;

    return (
        <div style={{ padding: '2rem' }}>
            <button
                onClick={handleClick}
                style={{
                    padding: '12px 24px',
                    background: '#6b8eff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                }}
            >
                Direct FUUL Events Disabled
            </button>
            <p style={{ marginTop: '1rem', color: '#888' }}>
                Connected wallet: {userWalletKey?.toString() || 'None'}
            </p>
        </div>
    );
}
