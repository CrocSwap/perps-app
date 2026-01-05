import { DFLT_EMBER_MARKET } from '@crocswap-libs/ambient-ember';
import {
    isEstablished,
    useConnection,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WithdrawService } from '~/services/withdrawService';

interface WithdrawServiceResult {
    success: boolean;
    error?: string;
    signature?: string;
}

interface AvailableWithdrawBalance {
    balance: number;
    decimalized: number;
}

export interface UseWithdrawServiceReturn {
    availableBalance: AvailableWithdrawBalance | null;
    isLoading: boolean;
    error: string | null;
    executeWithdraw: (
        amount: number | undefined,
    ) => Promise<WithdrawServiceResult>;
    refreshBalance: () => Promise<void>;
    validateAmount: (amount: number) => { isValid: boolean; message?: string };
    startAutoRefresh: () => void;
    stopAutoRefresh: () => void;
}

/**
 * Hook for managing withdraw functionality with Solana transactions
 */
export function useWithdrawService(): UseWithdrawServiceReturn {
    const sessionState = useSession();
    const connection = useConnection();
    const [availableBalance, setAvailableBalance] =
        useState<AvailableWithdrawBalance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [withdrawService, setWithdrawService] =
        useState<WithdrawService | null>(null);
    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize withdraw service when session is established
    useEffect(() => {
        if (isEstablished(sessionState)) {
            const service = new WithdrawService(connection);
            setWithdrawService(service);
        } else {
            setWithdrawService(null);
        }
    }, [sessionState, connection]);

    // Fetch available withdraw balance
    const refreshBalance = useCallback(async () => {
        if (!withdrawService || !isEstablished(sessionState)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get user's wallet public key
            const userWalletKey =
                sessionState.walletPublicKey || sessionState.sessionPublicKey;

            // Get marketId from TradeDataStore (default to BTC market if not available)
            const marketId = BigInt(DFLT_EMBER_MARKET.mktId); // TODO: Get from TradeDataStore when available

            // Try session key first (as that's what's used for transactions)
            let balance = await withdrawService.getAvailableWithdrawBalance(
                sessionState.sessionPublicKey,
                marketId,
            );

            // If no balance with session key, try wallet key
            if (!balance || balance.decimalized === 0) {
                balance = await withdrawService.getAvailableWithdrawBalance(
                    userWalletKey,
                    marketId,
                );
            }

            if (balance) {
                setAvailableBalance(balance);
            } else {
                setAvailableBalance({ balance: 0, decimalized: 0 });
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch available balance';
            setError(errorMessage);
            // Error already captured in error state
        } finally {
            setIsLoading(false);
        }
    }, [withdrawService, sessionState]);

    // Fetch balance on mount and when service is available
    useEffect(() => {
        if (withdrawService) {
            refreshBalance();
        }
    }, [withdrawService, refreshBalance]);

    // Start auto refresh function
    const startAutoRefresh = useCallback(() => {
        if (!withdrawService) return;

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
    }, [withdrawService, refreshBalance]);

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

    // Execute withdraw transaction
    const executeWithdraw = useCallback(
        async (amount: number | undefined): Promise<WithdrawServiceResult> => {
            if (!withdrawService || !isEstablished(sessionState)) {
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

                const result = await withdrawService.executeWithdraw(
                    amount,
                    sessionState.sessionPublicKey, // For transaction building
                    userWalletKey, // For PDA construction
                    sessionState.sendTransaction,
                );

                if (result.success) {
                    // Refresh balance after successful withdraw
                    await refreshBalance();
                } else {
                    setError(result.error || 'Withdraw failed');
                }

                return result;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Withdraw failed';
                setError(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                };
            } finally {
                setIsLoading(false);
            }
        },
        [withdrawService, sessionState, refreshBalance],
    );

    // Validate withdraw amount
    const validateAmount = useCallback(
        (amount: number): { isValid: boolean; message?: string } => {
            if (!withdrawService) {
                return { isValid: false, message: 'Service not available' };
            }

            // Check against available balance
            if (availableBalance && amount > availableBalance.decimalized) {
                return {
                    isValid: false,
                    message: `Amount exceeds available balance of $${availableBalance.decimalized.toFixed(2)}`,
                };
            }

            return withdrawService.validateWithdrawAmount(amount);
        },
        [withdrawService, availableBalance],
    );

    return {
        availableBalance,
        isLoading,
        error,
        executeWithdraw,
        refreshBalance,
        validateAmount,
        startAutoRefresh,
        stopAutoRefresh,
    };
}
