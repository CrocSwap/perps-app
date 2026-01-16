import { useCallback, useMemo, useState } from 'react';
import { LuChevronDown, LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useDepositService } from '~/hooks/useDepositService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useVaultManager } from '~/routes/vaults/useVaultManager';
import { useNotificationStore } from '~/stores/NotificationStore';
import styles from './DepositModal.module.css';
import { useTranslation } from 'react-i18next';

interface DepositModalProps {
    vault: {
        id: string;
        name: string;
        totalCapacity: number;
        totalDeposited: number;
        unit?: string;
    };
    onDeposit: (amount: number) => void;
    onClose: () => void;
}

export default function DepositModal({
    vault,
    onDeposit,
    onClose,
}: DepositModalProps) {
    const { t, i18n } = useTranslation();
    const notificationStore = useNotificationStore();
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [selectedToken] = useState('USDe');
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState<
        'idle' | 'pending' | 'success' | 'failed'
    >('idle');

    const {
        formatCurrency,
        validateAmount: validateVaultAmount,
        // isValidNumberInput,
        getAvailableCapacity,
    } = useVaultManager();

    const {
        balance: walletBalance,
        validateAmount: validateDepositAmount,
        executeDeposit,
        isLoading: isDepositLoading,
    } = useDepositService();

    const { formatNum } = useNumFormatter();

    // Use the unit from the vault or default to USD
    const unitValue = vault.unit || 'USD';

    // Get available capacity for this vault
    const availableCapacity = getAvailableCapacity(vault.id);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            setAmount(newValue);
            setError(null);
        },
        [],
    );

    // Calculate max available amount (minimum of vault capacity and wallet balance)
    const maxAvailableAmount = useMemo(() => {
        const userWalletBalance = walletBalance?.decimalized || 0;
        return Math.min(availableCapacity, userWalletBalance);
    }, [availableCapacity, walletBalance]);

    const handleMaxClick = useCallback(() => {
        setAmount(maxAvailableAmount.toString());
        setError(null);
    }, [maxAvailableAmount]);

    const handleDeposit = useCallback(async () => {
        const depositAmount = parseFloat(amount);
        setError(null);
        setIsProcessing(true);
        setTransactionStatus('pending');

        try {
            // Validate minimum deposit amount ($10)
            const depositValidation = validateDepositAmount(depositAmount);
            if (!depositValidation.isValid) {
                setError(depositValidation.message || 'Invalid deposit amount');
                setIsProcessing(false);
                setTransactionStatus('idle');
                return;
            }

            // Validate against vault capacity and wallet balance
            const vaultValidation = validateVaultAmount(
                depositAmount,
                maxAvailableAmount,
            );
            if (!vaultValidation.isValid) {
                setError(vaultValidation.message || 'Invalid amount');
                setIsProcessing(false);
                setTransactionStatus('idle');
                return;
            }

            // Create a timeout promise
            const timeoutPromise: ReturnType<typeof executeDeposit> =
                new Promise((_, reject) => {
                    setTimeout(
                        () =>
                            reject(
                                new Error(
                                    t('transactions.transactionTimedOut', {
                                        timeInSeconds: 15,
                                    }),
                                ),
                            ),
                        15000,
                    );
                });

            // Race between the deposit and the timeout
            const result = await Promise.race<
                Awaited<ReturnType<typeof executeDeposit>>
            >([executeDeposit(depositAmount), timeoutPromise]);

            if (result.success && result.confirmed) {
                setTransactionStatus('success');
                // Update vault state through parent component
                onDeposit(depositAmount);
                // Clear the form
                setAmount('');

                // Show success notification
                notificationStore.add({
                    title: t('transactions.depositSuccessful'),
                    message: t('transactions.successfullyDeposited', {
                        amount: formatNum(depositAmount, 2, true, false),
                        unit: unitValue,
                    }),
                    icon: 'check',
                });

                // Close modal on success - notification will show after modal closes
                onClose();
            } else {
                setTransactionStatus('failed');
                setError(
                    result.error || t('transactions.txFailedOrNotConfirmed'),
                );
            }
        } catch (error) {
            setTransactionStatus('failed');
            setError(error instanceof Error ? error.message : 'Deposit failed');
        } finally {
            setIsProcessing(false);
        }
    }, [
        amount,
        maxAvailableAmount,
        validateDepositAmount,
        validateVaultAmount,
        executeDeposit,
        onDeposit,
        i18n.language,
    ]);

    const infoItems = [
        {
            label: t('transactions.availableToDeposit'),
            value: formatCurrency(maxAvailableAmount, unitValue),
            tooltip: t('transactions.availableToDepositTooltip'),
        },
        {
            label: t('transactions.walletBalance'),
            value: formatCurrency(walletBalance?.decimalized || 0, unitValue),
            tooltip: t('transactions.walletBalanceTooltip'),
        },
    ];

    // Check if amount is below minimum
    const isBelowMinimum = useMemo(() => {
        if (!amount) return false;
        const depositAmount = parseFloat(amount);
        const result =
            !isNaN(depositAmount) && depositAmount > 0 && depositAmount < 5;
        console.log(
            'isBelowMinimum check - amount:',
            amount,
            'result:',
            result,
        );
        return result;
    }, [amount]);

    // Enhanced button state logic
    const isButtonDisabled = useMemo(() => {
        if (!amount || isProcessing || isDepositLoading) return true;

        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) return true;

        // Check minimum deposit requirement
        const depositValidation = validateDepositAmount(depositAmount);
        if (!depositValidation.isValid) return true;

        // Check against available capacity and wallet balance
        if (depositAmount > maxAvailableAmount) return true;

        return false;
    }, [
        amount,
        isProcessing,
        isDepositLoading,
        validateDepositAmount,
        maxAvailableAmount,
    ]);

    // Enhanced button text logic
    const buttonText = useMemo(() => {
        if (transactionStatus === 'pending')
            return t('transactions.confirmingTransaction');
        if (isProcessing) return t('common.processing');
        if (isDepositLoading) return t('common.loading');

        if (amount) {
            const depositAmount = parseFloat(amount);
            console.log(
                'Button text check - amount:',
                amount,
                'parsed:',
                depositAmount,
            );

            if (!isNaN(depositAmount) && depositAmount > 0) {
                const depositValidation = validateDepositAmount(depositAmount);
                console.log('Validation result:', depositValidation);

                if (!depositValidation.isValid) {
                    return (
                        depositValidation.message ||
                        t('transactions.invalidAmount')
                    );
                }
            }
        }

        return t('common.deposit');
    }, [
        amount,
        isProcessing,
        isDepositLoading,
        validateDepositAmount,
        transactionStatus,
    ]);

    return (
        <div className={styles.container}>
            {/* <header>
                <span />
                <h3>Deposit</h3>
                <MdClose onClick={onClose} />
            </header> */}
            <div className={styles.textContent}>
                <h4>
                    {t('transactions.depositToVault', {
                        unitValue,
                        vaultName: vault.name,
                    })}
                </h4>
                <p>
                    {t('transactions.depositToVaultMsg', {
                        unitValue,
                        vaultName: vault.name,
                    })}
                </p>
            </div>

            <div className={styles.dropdownContainer}>
                <span>{selectedToken}</span>
                <LuChevronDown size={22} />
            </div>

            <div className={styles.inputContainer}>
                <h6>
                    {t('common.amount') + ' '}
                    {isBelowMinimum && (
                        <span className={styles.minWarning}>(Min: $10)</span>
                    )}
                </h6>
                <input
                    type='text'
                    value={amount}
                    onChange={handleInputChange}
                    aria-label={t('aria.depositInput')}
                    data-modal-initial-focus
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder={t('transactions.enterAmountMin10')}
                    min='0'
                    step='any'
                    className={isBelowMinimum ? styles.inputBelowMin : ''}
                />
                <button
                    onClick={handleMaxClick}
                    className={styles.maxButton}
                    aria-label={t('aria.setMaxAmount')}
                >
                    Max
                </button>
                {error && <div className={styles.error}>{error}</div>}
                {transactionStatus === 'failed' && !error && (
                    <div className={styles.error}>
                        {t('transactions.txFailedTryAgain')}
                    </div>
                )}
            </div>

            <div className={styles.contentContainer}>
                {infoItems.map((info, idx) => (
                    <div className={styles.infoRow} key={idx}>
                        <div className={styles.infoLabel}>
                            {info.label}
                            {info?.tooltip && (
                                <Tooltip
                                    content={info?.tooltip}
                                    position='right'
                                >
                                    <LuCircleHelp size={12} />
                                </Tooltip>
                            )}
                        </div>
                        <div className={styles.infoValue}>{info.value}</div>
                    </div>
                ))}
            </div>
            <button
                className={`${styles.actionButton} ${isBelowMinimum ? styles.belowMinimum : ''}`}
                onClick={(e) => {
                    if (isBelowMinimum) {
                        e.preventDefault();
                        setError(
                            t('transactions.minDepositAmountIs', {
                                amount: '$5.00',
                            }),
                        );
                        // Clear error after 3 seconds
                        setTimeout(() => setError(null), 3000);
                        return;
                    }
                    handleDeposit();
                }}
                disabled={isButtonDisabled && !isBelowMinimum}
            >
                {buttonText}
            </button>
        </div>
    );
}
