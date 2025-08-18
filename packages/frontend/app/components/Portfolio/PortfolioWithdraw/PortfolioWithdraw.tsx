import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import Tooltip from '~/components/Tooltip/Tooltip';
import useDebounce from '~/hooks/useDebounce';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useNotificationStore } from '~/stores/NotificationStore';
import { blockExplorer } from '~/utils/Constants';
import FogoLogo from '../../../assets/tokens/FOGO.svg';
import styles from './PortfolioWithdraw.module.css';

interface propsIF {
    portfolio: {
        id: string;
        name: string;
        availableBalance: number;
        unit?: string;
    };
    onWithdraw: (amount?: number | undefined) => void;
    onClose: () => void;
    isProcessing?: boolean;
}

function PortfolioWithdraw({
    portfolio,
    onWithdraw,
    onClose,
    isProcessing = false,
}: propsIF) {
    const notificationStore = useNotificationStore();
    const [rawInputString, setRawInputString] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [transactionStatus, setTransactionStatus] = useState<
        'idle' | 'pending' | 'success' | 'failed'
    >('idle');

    const {
        formatNum,
        parseFormattedWithOnlyDecimals,
        formatNumWithOnlyDecimals,
        activeDecimalSeparator,
    } = useNumFormatter();

    const withdrawInputNum = parseFormattedWithOnlyDecimals(rawInputString);

    const MIN_WITHDRAW_AMOUNT = 1;

    const [maxModeActive, setMaxModeActive] = useState(false);
    // debounced invalid state

    // withdrawal amount within 0.005 of available balance
    const userAtTheirMax =
        withdrawInputNum >= portfolio.availableBalance - 0.005 &&
        withdrawInputNum <= portfolio.availableBalance + 0.005;

    const isSizeLessThanMinimum =
        !userAtTheirMax &&
        !maxModeActive &&
        !!withdrawInputNum &&
        withdrawInputNum < MIN_WITHDRAW_AMOUNT;

    const isSizeInvalid: boolean =
        !!withdrawInputNum &&
        (isNaN(withdrawInputNum) || isSizeLessThanMinimum);

    const isSizeInvalidDebounced = useDebounce<boolean>(isSizeInvalid, 500);

    const showInvalidSizeWarning = isSizeInvalid
        ? isSizeInvalidDebounced
        : false;

    const userBalanceLessThanMinimum =
        portfolio.availableBalance < MIN_WITHDRAW_AMOUNT;

    const amountExceedsUserBalance =
        withdrawInputNum > portfolio.availableBalance;

    // Memoize button disabled state calculation
    const isButtonDisabled = useMemo(
        () =>
            isNaN(withdrawInputNum) ||
            isProcessing ||
            !rawInputString ||
            withdrawInputNum <= 0 ||
            isSizeInvalid ||
            (amountExceedsUserBalance && !userAtTheirMax),
        [
            isProcessing,
            rawInputString,
            showInvalidSizeWarning,
            amountExceedsUserBalance,
            withdrawInputNum,
            userAtTheirMax,
        ],
    );

    const validateAmount = useCallback(
        (amount: number, maxAmount: number) => {
            if (!amount || isNaN(amount)) {
                return {
                    isValid: false,
                    message: 'Please enter a valid amount',
                };
            }

            if (amount <= 0) {
                return {
                    isValid: false,
                    message: 'Amount must be greater than 0',
                };
            }

            if (amount > maxAmount && !maxModeActive && !userAtTheirMax) {
                return {
                    isValid: false,
                    message: `Amount exceeds available balance of ${formatNum(maxAmount, 2, true, true)}`,
                };
            }

            return {
                isValid: true,
                message: null,
            };
        },
        [maxModeActive, userAtTheirMax],
    );

    const handleMaxClick = useCallback(() => {
        if (maxModeActive) {
            setMaxModeActive(false);
            return;
        }
        setRawInputString(
            '$' +
                formatNumWithOnlyDecimals(portfolio.availableBalance, 2, false),
        );
        setMaxModeActive(true);
    }, [portfolio.availableBalance, maxModeActive]);

    useEffect(() => {
        if (maxModeActive) {
            setRawInputString(
                '$' +
                    formatNumWithOnlyDecimals(
                        portfolio.availableBalance,
                        2,
                        false,
                    ),
            );
        }
    }, [maxModeActive, portfolio.availableBalance]);

    const handleWithdraw = useCallback(async () => {
        setError(null);
        setTransactionStatus('pending');

        const validation = validateAmount(
            withdrawInputNum,
            portfolio.availableBalance,
        );

        if (!validation.isValid) {
            setError(validation.message);
            setTransactionStatus('idle');
            return;
        }

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () =>
                        reject(
                            new Error('Transaction timed out after 15 seconds'),
                        ),
                    15000,
                );
            });

            // Race between the withdraw and the timeout
            const result = await Promise.race([
                maxModeActive || userAtTheirMax
                    ? onWithdraw()
                    : onWithdraw(withdrawInputNum),
                timeoutPromise,
            ]);

            // Check if the result indicates failure
            if (result && result.success === false) {
                setTransactionStatus('failed');
                setError(result.error || 'Transaction failed');
                notificationStore.add({
                    title: 'Withdrawal Failed',
                    message: result.error || 'Transaction failed',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            } else {
                setTransactionStatus('success');

                // Show success notification
                notificationStore.add({
                    title: 'Withdrawal Successful',
                    message: `Successfully withdrew ${formatNum(withdrawInputNum, 2, true, false)} fUSD`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });

                // Close modal on success - notification will show after modal closes
                if (onClose) {
                    onClose();
                }
            }
        } catch (error) {
            setTransactionStatus('failed');
            setError(
                error instanceof Error ? error.message : 'Withdrawal failed',
            );
        }
    }, [
        withdrawInputNum,
        portfolio.availableBalance,
        onWithdraw,
        validateAmount,
        onClose,
        notificationStore,
    ]);

    // Memoize info items to prevent recreating on each render
    const infoItems = useMemo(
        () => [
            {
                label: 'Available to withdraw',
                value: !isNaN(portfolio.availableBalance)
                    ? formatNum(portfolio.availableBalance, 2, true, true)
                    : '-',
                tooltip:
                    'The total amount you have available to withdraw from your portfolio',
            },
        ],
        [portfolio.availableBalance, formatNum],
    );

    return (
        <div className={styles.container}>
            <div className={styles.textContent}>
                <img src={FogoLogo} alt='Fogo Chain Logo' width='64px' />
                {/* <h4>Withdraw {unitValue} to Fogo</h4> */}
                <h4>Withdraw fUSD to Fogo</h4>
                <div>
                    <p>fUSD will be sent to your address.</p>
                </div>
            </div>

            <div className={styles.input_container}>
                <h6>Amount</h6>
                {showInvalidSizeWarning ? (
                    userBalanceLessThanMinimum ? (
                        <span>
                            {`Min: ${formatNum(MIN_WITHDRAW_AMOUNT, 2, true, true)} or Max`}
                        </span>
                    ) : (
                        <span>
                            Min: {formatNum(MIN_WITHDRAW_AMOUNT, 2, true, true)}
                        </span>
                    )
                ) : null}
                <NumFormattedInput
                    placeholder='Enter amount (min $1)'
                    value={rawInputString}
                    onChange={(
                        event: string | React.ChangeEvent<HTMLInputElement>,
                    ) => {
                        if (typeof event === 'string') {
                            setRawInputString(event);
                            setMaxModeActive(false);
                        } else {
                            setRawInputString(event.target.value);
                            setMaxModeActive(false);
                        }
                    }}
                    autoFocus
                    aria-label='withdraw input'
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter' && !isButtonDisabled) {
                            handleWithdraw();
                        }
                    }}
                    inputRegexOverride={RegExp(
                        `^\\$?\\d*(?:\\${activeDecimalSeparator}\\d*)?$`,
                    )}
                />
                <button
                    onClick={handleMaxClick}
                    disabled={isProcessing}
                    className={maxModeActive ? styles.active : ''}
                >
                    Max
                </button>
                {error && <div className={styles.error}>{error}</div>}
                {transactionStatus === 'failed' && !error && (
                    <div className={styles.error}>
                        Transaction failed. Please try again.
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

            <SimpleButton
                bg='accent1'
                onClick={handleWithdraw}
                disabled={isButtonDisabled}
                className={`plausible-event-name=Withdraw+Button+Click plausible-event-maxActive=${maxModeActive}`}
            >
                {transactionStatus === 'pending'
                    ? 'Confirming Transaction...'
                    : isProcessing
                      ? 'Processing...'
                      : 'Withdraw'}
            </SimpleButton>
        </div>
    );
}

export default memo(PortfolioWithdraw);
