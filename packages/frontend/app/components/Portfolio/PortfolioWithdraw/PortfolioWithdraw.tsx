import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import Tooltip from '~/components/Tooltip/Tooltip';
import useDebounce from '~/hooks/useDebounce';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useNotificationStore } from '~/stores/NotificationStore';
import { getTxLink } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import FogoLogo from '../../../assets/tokens/FOGO.svg';
import styles from './PortfolioWithdraw.module.css';
import { t } from 'i18next';

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
                    message: t('portfolio.validAmountRequired'),
                };
            }

            if (amount <= 0) {
                return {
                    isValid: false,
                    message: t('portfolio.amountGreaterThanZero'),
                };
            }

            if (amount > maxAmount && !maxModeActive && !userAtTheirMax) {
                return {
                    isValid: false,
                    message: t('portfolio.exceedsAvailableBalance', {
                        balance: formatNum(maxAmount, 2, true, true),
                    }),
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

        const timeOfTxBuildStart = Date.now();
        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error(t('portfolio.transactionTimedOut'))),
                    15000,
                );
            });

            // Race between the withdraw and the timeout
            const result: any = await Promise.race([
                maxModeActive || userAtTheirMax
                    ? onWithdraw()
                    : onWithdraw(withdrawInputNum),
                timeoutPromise,
            ]);

            // Check if the result indicates failure
            if (result && result.success === false) {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Withdrawal Fail',
                            success: false,
                            maxActive: maxModeActive,
                            errorMessage:
                                result.error ||
                                t('transactions.transactionFailed'),
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                setTransactionStatus('failed');
                setError(result.error || t('transactions.transactionFailed'));
                notificationStore.add({
                    title: t('transactions.withdrawFailed'),
                    message:
                        result.error || t('transactions.transactionFailed'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(result.signature),
                });
            } else {
                setTransactionStatus('success');

                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Withdrawal Success',
                            success: true,
                            maxActive: maxModeActive,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show success notification
                notificationStore.add({
                    title: t('transactions.withdrawalSuccessful'),
                    message: t('transactions.successfullyWithdrawn', {
                        amount: formatNum(withdrawInputNum, 2, true, false),
                        unit: 'fUSD',
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
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
                error instanceof Error
                    ? error.message
                    : t('transactions.withdrawFailed'),
            );
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Withdrawal Fail',
                        success: false,
                        maxActive: maxModeActive,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : t('transactions.unknownErrorOccurred'),
                    },
                });
            }
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
                label: t('transactions.availableToWithdraw'),
                value: !isNaN(portfolio.availableBalance)
                    ? formatNum(portfolio.availableBalance, 2, true, true)
                    : '-',
                tooltip: t('transactions.availableToWithdrawTooltip'),
            },
        ],
        [portfolio.availableBalance, formatNum],
    );

    return (
        <div className={styles.container}>
            <div className={styles.textContent}>
                <img
                    src={FogoLogo}
                    alt={t('portfolio.fogoChainLogo')}
                    width='64px'
                />
                {/* <h4>Withdraw {unitValue} to Fogo</h4> */}
                <h4>{t('withdraw.prompt', { token: 'fUSD' })}</h4>
                <div>
                    <p>{t('withdraw.explanation', { token: 'fUSD' })}</p>
                </div>
            </div>

            <div className={styles.input_container}>
                <h6>{t('common.amount')}</h6>
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
                    placeholder={t('withdraw.input_prompt', {
                        MIN_WITHDRAW_AMOUNT,
                    })}
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
                    dataModalInitialFocus
                    aria-label={t('aria.withdrawInput')}
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
                    aria-label={t('aria.setMaxAmount')}
                    aria-pressed={maxModeActive}
                >
                    {t('common.max')}
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

            <SimpleButton
                bg='accent1'
                onClick={handleWithdraw}
                disabled={isButtonDisabled}
            >
                {transactionStatus === 'pending'
                    ? t('transactions.confirmingTransaction')
                    : isProcessing
                      ? t('transactions.processing')
                      : t('common.withdraw')}
            </SimpleButton>
        </div>
    );
}

export default memo(PortfolioWithdraw);
