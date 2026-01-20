import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useReferralStore } from '~/stores/ReferralStore';

// Custom API key for this specific event
const TEMP_FUUL_API_KEY =
    'e472ee00174179050d1ca77c82c55eb368bab7c8de360cc5362072bb5ccbaf42';

export default function testpage() {
    const sessionState = useSession();
    const referralStore = useReferralStore();

    const handleClick = async () => {
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

        try {
            // Create a dynamic message with current date
            const currentDate = new Date().toISOString().split('T')[0];
            const message = `Accept affiliate code ${referralStore.cached} on ${currentDate}`;

            // Convert message to Uint8Array
            const messageBytes = new TextEncoder().encode(message);

            // Get the signature from the session
            const signatureBytes =
                await sessionState.solanaWallet.signMessage(messageBytes);

            // Convert the signature to base64
            const signatureArray = Array.from(new Uint8Array(signatureBytes));
            const binaryString = String.fromCharCode.apply(
                null,
                signatureArray,
            );
            const signature = btoa(binaryString);

            // Direct fetch to Fuul API with custom API key
            const ENDPOINT = 'https://api.fuul.xyz/api/v1/events';
            const trackingId = localStorage.getItem('fuul.tracking_id') || '';

            const payload = {
                name: 'connect_wallet',
                user: {
                    identifier: userWalletKey.toString(),
                    identifier_type: 'solana_address',
                },
                args: {
                    page: document.location.pathname,
                    locationOrigin: document.location.origin,
                },
                metadata: {
                    tracking_id: trackingId,
                },
                signature,
                signature_message: message,
                signature_public_key: userWalletKey.toString(),
            };

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TEMP_FUUL_API_KEY}`,
            };

            console.log('FUUL identifyUser request:', {
                url: ENDPOINT,
                payload,
                headers,
            });

            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            console.log('FUUL identifyUser response status:', response.status);
            const text = await response.text();
            console.log('FUUL identifyUser response body:', text || '(empty)');
        } catch (error) {
            console.error('Error in identifyUser:', error);
        }
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
                Send FUUL Identify User Event
            </button>
            <p style={{ marginTop: '1rem', color: '#888' }}>
                Connected wallet: {userWalletKey?.toString() || 'None'}
            </p>
        </div>
    );
}
