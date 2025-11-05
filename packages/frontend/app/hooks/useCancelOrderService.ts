import {
    isEstablished,
    useConnection,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useCallback, useEffect, useState } from 'react';
import {
    CancelOrderService,
    type CancelOrderParams,
    type CancelOrderResult,
} from '~/services/cancelOrderService';

export interface UseCancelOrderServiceReturn {
    isLoading: boolean;
    error: string | null;
    executeCancelOrder: (
        params: CancelOrderParams,
    ) => Promise<CancelOrderResult>;
}

/**
 * Hook for managing cancel order functionality with Solana transactions
 */
export function useCancelOrderService(): UseCancelOrderServiceReturn {
    const sessionState = useSession();
    const connection = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cancelOrderService, setCancelOrderService] =
        useState<CancelOrderService | null>(null);

    // Initialize cancel order service when session is established
    useEffect(() => {
        if (isEstablished(sessionState)) {
            const service = new CancelOrderService(connection);
            setCancelOrderService(service);
        } else {
            console.log(
                '⚠️ Session not established, cancel order service not created',
            );
            setCancelOrderService(null);
        }
    }, [sessionState, connection]);

    // Execute cancel order transaction
    const executeCancelOrder = useCallback(
        async (params: CancelOrderParams): Promise<CancelOrderResult> => {
            if (!cancelOrderService || !isEstablished(sessionState)) {
                return {
                    success: false,
                    error: 'Session not established',
                };
            }

            setIsLoading(true);
            setError(null);

            try {
                console.log('🚀 Executing cancel order:', params);

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

                const result = await cancelOrderService.executeCancelOrder(
                    params,
                    sessionState.sessionPublicKey, // For transaction building/signing
                    userWalletKey, // For order owner
                    sessionState.sendTransaction,
                    paymaster, // Pass paymaster as rent payer
                );

                if (!result.success) {
                    setError(result.error || 'Cancel order failed');
                }

                return result;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Cancel order failed';
                setError(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                };
            } finally {
                setIsLoading(false);
            }
        },
        [cancelOrderService, sessionState],
    );

    return {
        isLoading,
        error,
        executeCancelOrder,
    };
}
