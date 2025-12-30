import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDepositService } from '~/hooks/useDepositService';
import { useWithdrawService } from '~/hooks/useWithdrawService';
import { useUserDataStore } from '~/stores/UserDataStore';

interface PortfolioDataIF {
    id: string;
    name: string;
    // totalValueUSD: number;
    // availableBalance: number;
    balances: {
        contract: number;
        wallet: number;
    };
    unit: string;
    tradingVolume: {
        daily: number;
        weekly: number;
        biWeekly: number;
        monthly: number;
    };
    fees: {
        taker: number;
        maker: number;
    };
}

const CONTRACT_BALANCE = 1987654.32;

// Mock data
export const portfolioData: PortfolioDataIF = {
    id: 'main-portfolio',
    name: 'Main Portfolio',
    // totalValueUSD: 1987654.32,
    // availableBalance: 1987654.32,
    balances: {
        contract: CONTRACT_BALANCE,
        wallet: 0, // Will be replaced with real balance
    },
    unit: 'USD',
    tradingVolume: {
        daily: 215678.9,
        weekly: 1345678.23,
        biWeekly: 2456789.01,
        monthly: 5678901.23,
    },
    fees: {
        taker: 0.035,
        maker: 0.01,
    },
};

function portfolioReducer(
    state: PortfolioDataIF,
    action: any,
): PortfolioDataIF {
    switch (action.type) {
        case 'DEPOSIT':
            return {
                ...state,
                // availableBalance: state.availableBalance + action.amount,
                // totalValueUSD: state.totalValueUSD + action.amount,
                balances: {
                    contract: state.balances.contract + action.amount,
                    wallet: state.balances.wallet - action.amount,
                },
            };
        case 'WITHDRAW':
            return {
                ...state,
                // availableBalance: state.availableBalance - action.amount,
                // totalValueUSD: state.totalValueUSD - action.amount,
                balances: {
                    contract: state.balances.contract - action.amount,
                    wallet: state.balances.wallet + action.amount,
                },
            };
        case 'SEND':
            return {
                ...state,
                // availableBalance: state.availableBalance - action.amount,
                // totalValueUSD: state.totalValueUSD - action.amount,
                balances: {
                    contract: state.balances.contract - action.amount,
                    wallet: state.balances.wallet,
                },
            };
        case 'UPDATE_WALLET_BALANCE':
            return {
                ...state,
                balances: {
                    ...state.balances,
                    wallet: action.balance,
                },
            };
        case 'UPDATE_CONTRACT_BALANCE':
            return {
                ...state,
                balances: {
                    ...state.balances,
                    contract: action.balance,
                },
            };
        default:
            return state;
    }
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const OTHER_FORMATTER = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
});

export function usePortfolioManager() {
    const { t } = useTranslation();
    const userDataStore = useUserDataStore();
    const userAddress = userDataStore.userAddress;

    const {
        balance: walletBalance,
        error: balanceError,
        executeDeposit,
        validateAmount,
        startAutoRefresh: startDepositAutoRefresh,
        stopAutoRefresh: stopDepositAutoRefresh,
    } = useDepositService();

    const {
        availableBalance: withdrawableBalance,
        error: withdrawError,
        executeWithdraw,
        startAutoRefresh: startWithdrawAutoRefresh,
        stopAutoRefresh: stopWithdrawAutoRefresh,
    } = useWithdrawService();

    // Create initial portfolio data with real wallet balance and withdrawable balance
    const initialPortfolioData = useMemo(
        () => ({
            ...portfolioData,
            balances: {
                contract: withdrawableBalance?.decimalized || CONTRACT_BALANCE,
                wallet: walletBalance?.decimalized || 0,
            },
        }),
        [walletBalance, withdrawableBalance],
    );

    const [portfolio, dispatch] = useReducer(
        portfolioReducer,
        initialPortfolioData,
    );

    // Update portfolio wallet balance when real balance changes
    useEffect(() => {
        if (walletBalance?.decimalized !== undefined) {
            dispatch({
                type: 'UPDATE_WALLET_BALANCE',
                balance: walletBalance.decimalized,
            });
        }
    }, [walletBalance]);

    // Update portfolio contract balance when withdrawable balance changes
    useEffect(() => {
        if (withdrawableBalance?.decimalized !== undefined) {
            dispatch({
                type: 'UPDATE_CONTRACT_BALANCE',
                balance: withdrawableBalance.decimalized,
            });
        }
    }, [withdrawableBalance]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{
        isLoading: boolean;
        error: string | null;
    }>({
        isLoading: false,
        error: null,
    });

    const [userData, setUserData] = useState<any>();

    const fetchUserData = useCallback(async () => {
        if (!userAddress) {
            setUserData(undefined);
            return;
        }

        try {
            const EMBER_ENDPOINT_ALL =
                'https://ember-leaderboard.liquidity.tools/leaderboard';
            const emberEndpointForUser =
                EMBER_ENDPOINT_ALL + '/' + userAddress.toString();

            const response = await fetch(emberEndpointForUser);
            const data = await response.json();

            if (data.error) {
                console.log('error fetching user data');
            } else if (data.leaderboard && data.leaderboard.length > 0) {
                setUserData({ data });
            }
        } catch (error) {
            console.log(error);
        }
    }, [userAddress]);

    // fetch user data on mount and every 30 seconds
    useEffect(() => {
        fetchUserData();
        const interval = setInterval(() => {
            fetchUserData();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchUserData]);

    // Memoized formatter function
    const formatCurrency = useCallback(
        (value: number, unit: string = 'USD') => {
            if (unit === 'USD') {
                return USD_FORMATTER.format(value);
            } else {
                return OTHER_FORMATTER.format(value) + ' ' + unit;
            }
        },
        [],
    );

    const selectedPortfolio = useMemo(() => portfolio, [portfolio]);

    const processDeposit = useCallback(
        async (amount: number | 'max') => {
            // Set processing state to true
            setIsProcessing(true);
            setStatus({ isLoading: true, error: null });

            try {
                // Execute the real Solana deposit transaction
                const result = await executeDeposit(amount);

                if (result.success) {
                    // Update portfolio balance using reducer only after successful transaction
                    dispatch({ type: 'DEPOSIT', amount });
                    setStatus({ isLoading: false, error: null });
                } else {
                    setStatus({
                        isLoading: false,
                        error: result.error || t('transactions.depositFailed'),
                    });
                }
                return result;
            } catch (error) {
                setStatus({
                    isLoading: false,
                    error: (error as Error).message,
                });
                return { success: false, error: (error as Error).message };
            } finally {
                setIsProcessing(false);
            }
        },
        [executeDeposit],
    );

    const processWithdraw = useCallback(
        async (amount?: number) => {
            // Set processing state to true
            setIsProcessing(true);
            setStatus({ isLoading: true, error: null });

            try {
                // Execute the real Solana withdraw transaction
                const result = await executeWithdraw(amount);

                if (result.success) {
                    // Update portfolio balance using reducer only after successful transaction
                    dispatch({ type: 'WITHDRAW', amount });
                    setStatus({ isLoading: false, error: null });
                } else {
                    setStatus({
                        isLoading: false,
                        error: result.error || t('transactions.withdrawFailed'),
                    });
                }
                return result;
            } catch (error) {
                setStatus({
                    isLoading: false,
                    error: (error as Error).message,
                });
                return { success: false, error: (error as Error).message };
            } finally {
                setIsProcessing(false);
            }
        },
        [executeWithdraw],
    );

    const processSend = useCallback(
        (address: string, amount: number) => {
            if (!address || amount > portfolio.balances.contract) {
                setStatus({
                    isLoading: false,
                    error: !address
                        ? t('portfolio.invalidAddress')
                        : t('portfolio.insufficientFunds'),
                });
                return;
            }

            // Set processing state to true
            setIsProcessing(true);
            setStatus({ isLoading: true, error: null });

            // Simulate network delay (2 seconds)
            setTimeout(() => {
                try {
                    // Update portfolio balance using reducer
                    dispatch({ type: 'SEND', amount });
                    setStatus({ isLoading: false, error: null });
                    setIsProcessing(false);
                } catch (error) {
                    setStatus({
                        isLoading: false,
                        error: (error as Error).message,
                    });
                    setIsProcessing(false);
                }
            }, 2000);
        },
        [portfolio.balances.contract],
    );

    return {
        portfolio,
        selectedPortfolio,
        isProcessing: isProcessing,
        setIsProcessing,
        status: balanceError
            ? { isLoading: false, error: balanceError }
            : withdrawError
              ? { isLoading: false, error: withdrawError }
              : status,
        formatCurrency,
        processDeposit,
        processWithdraw,
        processSend,
        validateAmount,
        // Expose auto refresh functions
        startDepositAutoRefresh,
        stopDepositAutoRefresh,
        startWithdrawAutoRefresh,
        stopWithdrawAutoRefresh,
        // Ember leaderboard user data
        userData,
    };
}
