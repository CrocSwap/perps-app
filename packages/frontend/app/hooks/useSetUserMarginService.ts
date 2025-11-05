import {
    isEstablished,
    useConnection,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useCallback, useEffect, useState } from 'react';
import {
    SetUserMarginService,
    type SetUserMarginParams,
    type SetUserMarginResult,
} from '~/services/setUserMarginService';

export interface UseSetUserMarginServiceReturn {
    isLoading: boolean;
    error: string | null;
    executeSetUserMargin: (
        params: SetUserMarginParams,
    ) => Promise<SetUserMarginResult>;
}

/**
 * Hook for managing set user margin functionality with Solana transactions
 */
export function useSetUserMarginService(): UseSetUserMarginServiceReturn {
    const sessionState = useSession();
    const connection = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [setUserMarginService, setSetUserMarginService] =
        useState<SetUserMarginService | null>(null);

    // Initialize set user margin service when session is established
    useEffect(() => {
        if (isEstablished(sessionState)) {
            const service = new SetUserMarginService(connection);
            setSetUserMarginService(service);
        } else {
            console.log(
                '⚠️ Session not established, set user margin service not created',
            );
            setSetUserMarginService(null);
        }
    }, [sessionState, connection]);

    // Execute set user margin transaction
    const executeSetUserMargin = useCallback(
        async (params: SetUserMarginParams): Promise<SetUserMarginResult> => {
            if (!setUserMarginService || !isEstablished(sessionState)) {
                return {
                    success: false,
                    error: 'Session not established',
                };
            }

            setIsLoading(true);
            setError(null);

            try {
                console.log('🚀 Executing set user margin:', params);

                // Get user's wallet public key
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                console.log('🔑 Using keys:', {
                    sessionPublicKey: sessionState.sessionPublicKey?.toString(),
                    userWalletKey: userWalletKey.toString(),
                });

                // Ensure sendTransaction is available
                if (typeof sessionState.sendTransaction !== 'function') {
                    throw new Error(
                        `sendTransaction is not available. Available methods: ${Object.entries(
                            sessionState,
                        )
                            .filter(([, value]) => typeof value === 'function')
                            .map(([key]) => key)
                            .join(', ')}`,
                    );
                }

                // Get paymaster from SessionState if available
                const paymaster = sessionState.payer || undefined;

                const result = await setUserMarginService.executeSetUserMargin(
                    params,
                    sessionState.sessionPublicKey, // For transaction building/signing
                    userWalletKey, // For user
                    sessionState.sendTransaction,
                    paymaster, // Pass paymaster as rent payer
                );

                if (!result.success) {
                    setError(result.error || 'Set user margin failed');
                }

                return result;
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Set user margin failed';
                setError(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                };
            } finally {
                setIsLoading(false);
            }
        },
        [setUserMarginService, sessionState],
    );

    return {
        isLoading,
        error,
        executeSetUserMargin,
    };
}
