import {
    isEstablished,
    useConnection,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    executeDeposit: (amount: number | 'max') => Promise<DepositServiceResult>;
    refreshBalance: () => Promise<void>;
    validateAmount: (amount: number) => { isValid: boolean; message?: string };
    startAutoRefresh: () => void;
    stopAutoRefresh: () => void;
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
    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const connection = useConnection();

    // Initialize deposit service when session is established
    useEffect(() => {
        if (isEstablished(sessionState)) {
            const service = new DepositService(connection);
            setDepositService(service);
        } else {
            setDepositService(null);
        }
    }, [sessionState, connection]);

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
                sessionState.walletPublicKey || sessionState.sessionPublicKey;
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

    // Start auto refresh function
    const startAutoRefresh = useCallback(() => {
        if (!depositService) return;

        // Clear any existing interval
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }

        // Refresh immediately
        refreshBalance();

        // Set up new interval
        const intervalId = setInterval(() => {
            refreshBalance();
        }, 2000);

        autoRefreshIntervalRef.current = intervalId;
    }, [depositService, refreshBalance]);

    // Stop auto refresh function
    const stopAutoRefresh = useCallback(() => {
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }
    }, []);

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (autoRefreshIntervalRef.current) {
                clearInterval(autoRefreshIntervalRef.current);
                autoRefreshIntervalRef.current = null;
            }
        };
    }, []);

    // Execute deposit transaction
    const executeDeposit = useCallback(
        async (amount: number | 'max'): Promise<DepositServiceResult> => {
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
                                    typeof sessionState[
                                        key as keyof typeof sessionState
                                    ] === 'function',
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
        startAutoRefresh,
        stopAutoRefresh,
    };
}
