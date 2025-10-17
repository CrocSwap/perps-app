import styles from './testpage.module.css';
import { Fuul, UserIdentifierType } from '@fuul/sdk';
import { useSession, isEstablished } from '@fogo/sessions-sdk-react';
import { useUserDataStore } from '~/stores/UserDataStore';
import { useReferralStore } from '~/stores/ReferralStore';

export default function testpage() {
    const sessionState = useSession();
    const isUserConnected = isEstablished(sessionState);

    const referralStore = useReferralStore();

    async function convert() {
        if (!isUserConnected) return;
        try {
            // Create a dynamic message with current date
            const currentDate = new Date().toISOString().split('T')[0];
            const message = `Accept affiliate code ${referralStore.active?.value} on ${currentDate}`;

            // Convert message to Uint8Array
            const messageBytes = new TextEncoder().encode(message);

            // Get the signature from the session
            const signatureBytes = await sessionState.signMessage(messageBytes);

            // Convert the signature to base64
            const signatureArray = Array.from(new Uint8Array(signatureBytes));
            const binaryString = String.fromCharCode.apply(
                null,
                signatureArray,
            );
            const signature = btoa(binaryString);

            // Call the Fuul SDK to identify the user

            const userWalletKey =
                sessionState.walletPublicKey || sessionState.sessionPublicKey;

            try {
                const response = await Fuul.identifyUser({
                    identifier: userWalletKey.toString(),
                    identifierType: UserIdentifierType.SolanaAddress,
                    signature,
                    signaturePublicKey: userWalletKey.toString(),
                    message,
                });
                console.log('Fuul.identifyUser successful:', response);
            } catch (error: any) {
                console.error('Detailed error in identifyUser:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers,
                    },
                });
                throw error; // Re-throw to be caught by the outer catch
            }
        } catch (error) {
            console.error('Error in identifyUser:', error);
            // Optionally show a user-friendly error message
            // You might want to implement this based on your UI framework
            // showErrorToast('Failed to identify user. Please try again.');
        }
    }

    return (
        <div className={styles.testpage}>
            <button onClick={convert}>Convert FULL Address</button>
        </div>
    );
}
