import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { DepositService } from '~/services/depositService';

interface DepositServiceResult {
    success: boolean;
    error?: string;
    signature?: string;
}

interface UserBalance {
    balance: number;
    decimalized: number;
}

export interface UseDepositServiceReturn {
    balance: UserBalance | null;
    isLoading: boolean;
    error: string | null;
    executeDeposit: (amount: number) => Promise<DepositServiceResult>;
    refreshBalance: () => Promise<void>;
    validateAmount: (amount: number) => { isValid: boolean; message?: string };
}

/**
 * Hook for managing deposit functionality with Solana transactions
 */
export function useDepositService(): UseDepositServiceReturn {
    const sessionState = useSession();
    const [balance, setBalance] = useState<UserBalance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [depositService, setDepositService] = useState<DepositService | null>(
        null,
    );

    // Initialize deposit service when session is established
    useEffect(() => {
        if (isEstablished(sessionState)) {
            const service = new DepositService(sessionState.connection);
            setDepositService(service);
        } else {
            setDepositService(null);
        }
    }, [sessionState]);

    // Fetch user balance
    const refreshBalance = useCallback(async () => {
        if (!depositService || !isEstablished(sessionState)) {
            setError('Session not established');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Try to find the correct user wallet public key
            const userWalletKey =
                sessionState.userPublicKey ||
                sessionState.walletPublicKey ||
                sessionState.sessionPublicKey;

            const userBalance =
                await depositService.getUserBalance(userWalletKey);
            setBalance(userBalance);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch balance';
            setError(errorMessage);
            console.error('Error fetching balance:', err);
        } finally {
            setIsLoading(false);
        }
    }, [depositService, sessionState]);

    // Fetch balance on mount and when service is available
    useEffect(() => {
        if (depositService) {
            refreshBalance();
        }
    }, [depositService, refreshBalance]);

    // Execute deposit transaction
    const executeDeposit = useCallback(
        async (amount: number): Promise<DepositServiceResult> => {
            if (!depositService || !isEstablished(sessionState)) {
                return {
                    success: false,
                    error: 'Session not established',
                };
            }

            setIsLoading(true);
            setError(null);

            try {
                // Get both keys: session key for transaction building, user wallet key for PDAs
                const userWalletKey =
                    sessionState.userPublicKey ||
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                // Ensure sendTransaction is available
                if (typeof sessionState.sendTransaction !== 'function') {
                    throw new Error(
                        `sendTransaction is not available. Available methods: ${Object.keys(
                            sessionState,
                        )
                            .filter(
                                (key) =>
                                    typeof sessionState[key] === 'function',
                            )
                            .join(', ')}`,
                    );
                }

                // Get payer from SessionState if available
                const payerPublicKey = sessionState.payer || undefined;

                // Using payer from SessionState if available

                const result = await depositService.executeDeposit(
                    amount,
                    sessionState.sessionPublicKey, // For transaction building
                    userWalletKey, // For PDA construction
                    sessionState.sendTransaction,
                    payerPublicKey,
                );

                if (result.success) {
                    // Refresh balance after successful deposit
                    await refreshBalance();
                } else {
                    setError(result.error || 'Deposit failed');
                }

                return result;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Deposit failed';
                setError(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                };
            } finally {
                setIsLoading(false);
            }
        },
        [depositService, sessionState, refreshBalance],
    );

    // Validate deposit amount
    const validateAmount = useCallback(
        (amount: number): { isValid: boolean; message?: string } => {
            if (!depositService) {
                return { isValid: false, message: 'Service not available' };
            }
            return depositService.validateDepositAmount(amount);
        },
        [depositService],
    );

    return {
        balance,
        isLoading,
        error,
        executeDeposit,
        refreshBalance,
        validateAmount,
    };
}
