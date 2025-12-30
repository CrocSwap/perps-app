import { memo, useCallback, useMemo, useState } from 'react';
import Tooltip from '~/components/Tooltip/Tooltip';
import styles from './PortfolioDeposit.module.css';
// import { useDebouncedCallback } from '~/hooks/useDebounce';
import { LuCircleHelp } from 'react-icons/lu';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import TokenDropdown, {
    AVAILABLE_TOKENS,
    type Token,
} from '~/components/TokenDropdown/TokenDropdown';
import useDebounce from '~/hooks/useDebounce';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useNotificationStore } from '~/stores/NotificationStore';
import { getTxLink, MIN_DEPOSIT_AMOUNT } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import FogoLogo from '../../../assets/tokens/FOGO.svg';
import { t } from 'i18next';

interface propsIF {
    portfolio: {
        id: string;
        name: string;
        availableBalance: number;
        unit?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDeposit: (amount: number | 'max') => void | Promise<any>;
    onClose: () => void;
    isProcessing?: boolean;
}

function PortfolioDeposit(props: propsIF) {
    const { portfolio, onDeposit, isProcessing = false } = props;
    const notificationStore = useNotificationStore();
    const {
        formatNum,
        parseFormattedWithOnlyDecimals,
        formatNumWithOnlyDecimals,
        activeDecimalSeparator,
    } = useNumFormatter();

    const [error, setError] = useState<string | null>(null);
    const [transactionStatus, setTransactionStatus] = useState<
        'idle' | 'pending' | 'success' | 'failed'
    >('idle');
    const [selectedToken, setSelectedToken] = useState<Token>(
        AVAILABLE_TOKENS.find(
            (token) => token.symbol === (portfolio.unit || 'USDe'),
        ) || AVAILABLE_TOKENS[0],
    );

    // Available balance for this portfolio
    const availableBalance = portfolio.availableBalance;

    const [rawInputString, setRawInputString] = useState('');

    const depositInputNum = parseFormattedWithOnlyDecimals(rawInputString);

    const isSizeInvalid: boolean =
        !isNaN(depositInputNum) &&
        depositInputNum > 0 &&
        depositInputNum < MIN_DEPOSIT_AMOUNT;

    // debounced invalid state
    const isSizeInvalidDebounced = useDebounce<boolean>(isSizeInvalid, 500);

    const showInvalidSizeWarning = isSizeInvalid
        ? isSizeInvalidDebounced
        : false;

    const [maxActive, setMaxActive] = useState(false);

    const handleMaxClick = useCallback(() => {
        setRawInputString('$' + formatNumWithOnlyDecimals(availableBalance, 2));
        setError(null);
        setMaxActive(true);
    }, [availableBalance]);

    const handleDeposit = useCallback(async () => {
        setError(null);
        setTransactionStatus('pending');

        if (!depositInputNum || isNaN(depositInputNum)) {
            setError(t('portfolio.validAmountRequired'));
            setTransactionStatus('idle');
            return;
        }

        if (depositInputNum <= 0) {
            setError(t('portfolio.amountGreaterThanZero'));
            setTransactionStatus('idle');
            return;
        }

        // Check minimum deposit amount
        if (depositInputNum < MIN_DEPOSIT_AMOUNT) {
            setError(
                t('portfolio.minDepositAmount', {
                    amount: formatNum(MIN_DEPOSIT_AMOUNT, 2, true, true),
                }),
            );
            setTransactionStatus('idle');
            return;
        }

        if (!maxActive && depositInputNum > availableBalance) {
            setError(
                t('portfolio.exceedsAvailableBalance', {
                    balance: availableBalance,
                }),
            );
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

            // Race between the deposit and the timeout
            const result = await Promise.race([
                maxActive ? onDeposit('max') : onDeposit(depositInputNum),
                timeoutPromise,
            ]);

            // Check if the result indicates failure
            if (result && result.success === false) {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Deposit Fail',
                            success: false,
                            maxActive: maxActive,
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
                    title: t('transactions.depositFailed'),
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
                            actionType: 'Deposit Success',
                            success: true,
                            maxActive: maxActive,
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
                    title: t('transactions.depositSuccessful'),
                    message: t('transactions.successfullyDeposited', {
                        amount: formatNum(depositInputNum, 2, true, false),
                        unit: 'fUSD',
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                    removeAfter: 5000,
                });

                // Close modal on success - notification will show after modal closes
                if (props.onClose) {
                    props.onClose();
                }
            }
        } catch (error) {
            setTransactionStatus('failed');
            setError(
                error instanceof Error
                    ? error.message
                    : t('transactions.depositFailed'),
            );
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Deposit Fail',
                        success: false,
                        maxActive: maxActive,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : t('transactions.unknownErrorOccurred'),
                    },
                });
            }
        }
    }, [availableBalance, onDeposit, formatNum, depositInputNum, maxActive]);

    const handleTokenSelect = useCallback((token: Token) => {
        setSelectedToken(token);
    }, []);

    // Memoize info items to prevent recreating on each render
    const infoItems = useMemo(() => {
        // Check if this is a USD-related token
        const isUSDToken =
            selectedToken.symbol === 'USD' ||
            selectedToken.symbol === 'USDe' ||
            selectedToken.symbol === 'fUSD' ||
            portfolio.unit === 'USD';

        return [
            {
                label: t('deposit.availableToDeposit'),
                value: !isNaN(availableBalance)
                    ? formatNum(
                          availableBalance,
                          isUSDToken ? 2 : 8,
                          true,
                          isUSDToken,
                      )
                    : '-',
                tooltip: t('portfolio.availableToDepositTooltip'),
            },
        ];
    }, [availableBalance, selectedToken.symbol, portfolio.unit, formatNum]);

    const isButtonDisabled = useMemo(
        () =>
            isProcessing ||
            !depositInputNum ||
            depositInputNum <= 0 ||
            (!maxActive && depositInputNum > availableBalance),
        [isProcessing, depositInputNum, availableBalance, maxActive],
    );

    const handleDepositChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement> | string) => {
            if (typeof event === 'string') {
                setRawInputString(event);
                setMaxActive(false);
            } else {
                setRawInputString(event.target.value);
                setMaxActive(false);
            }
        },
        [],
    );

    return (
        <div className={styles.container}>
            <div className={styles.textContent}>
                <img
                    src={FogoLogo}
                    alt={t('portfolio.fogoChainLogo')}
                    width='64px'
                />
                <h4>{t('deposit.prompt', { token: selectedToken.symbol })}</h4>
            </div>

            <TokenDropdown
                selectedToken={selectedToken.symbol}
                onTokenSelect={handleTokenSelect}
                disabled={isProcessing}
                className={styles.tokenDropdown}
            />

            <div className={styles.input_container}>
                <h6>{t('common.amount')}</h6>
                {showInvalidSizeWarning && (
                    <span>{`Min: ${formatNum(MIN_DEPOSIT_AMOUNT, 2, true, true)}`}</span>
                )}
                <NumFormattedInput
                    placeholder={t('deposit.input_prompt', {
                        MIN_DEPOSIT_AMOUNT,
                    })}
                    value={rawInputString}
                    onChange={handleDepositChange}
                    aria-label={t('aria.depositInput')}
                    dataModalInitialFocus
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (
                            e.key === 'Enter' &&
                            !isButtonDisabled &&
                            !isSizeInvalid
                        ) {
                            handleDeposit();
                        }
                    }}
                    inputRegexOverride={RegExp(
                        `^\\$?\\d*(?:\\${activeDecimalSeparator}\\d*)?$`,
                    )}
                />
                <button
                    onClick={handleMaxClick}
                    disabled={isProcessing}
                    aria-label={t('aria.setMaxAmount')}
                >
                    {t('common.max')}
                </button>
                {error && <div className={styles.error}>{error}</div>}
                {transactionStatus === 'failed' && !error && (
                    <div className={styles.error}>
                        {t('transactions.transactionFailed')}
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
                onClick={handleDeposit}
                disabled={isButtonDisabled || isSizeInvalid}
            >
                {transactionStatus === 'pending'
                    ? t('transactions.confirmingTransaction')
                    : isProcessing
                      ? t('transactions.processing')
                      : t('common.deposit')}
            </SimpleButton>
        </div>
    );
}

// Export memoized component
export default memo(PortfolioDeposit);
