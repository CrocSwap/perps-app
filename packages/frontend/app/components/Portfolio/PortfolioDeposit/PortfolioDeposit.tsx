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
import { blockExplorer, MIN_DEPOSIT_AMOUNT } from '~/utils/Constants';
import FogoLogo from '../../../assets/tokens/FOGO.svg';

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
            setError('Please enter a valid amount');
            setTransactionStatus('idle');
            return;
        }

        if (depositInputNum <= 0) {
            setError('Amount must be greater than 0');
            setTransactionStatus('idle');
            return;
        }

        // Check minimum deposit amount
        if (depositInputNum < MIN_DEPOSIT_AMOUNT) {
            setError(
                `Minimum deposit amount is ${formatNum(MIN_DEPOSIT_AMOUNT, 2, true, true)}`,
            );
            setTransactionStatus('idle');
            return;
        }

        if (!maxActive && depositInputNum > availableBalance) {
            setError(`Amount exceeds available balance of ${availableBalance}`);
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

            // Race between the deposit and the timeout
            const result = await Promise.race([
                maxActive ? onDeposit('max') : onDeposit(depositInputNum),
                timeoutPromise,
            ]);

            // Check if the result indicates failure
            if (result && result.success === false) {
                setTransactionStatus('failed');
                setError(result.error || 'Transaction failed');
                notificationStore.add({
                    title: 'Deposit Failed',
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
                    title: 'Deposit Successful',
                    message: `Successfully deposited ${formatNum(depositInputNum, 2, true, false)} fUSD`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });

                // Close modal on success - notification will show after modal closes
                if (props.onClose) {
                    props.onClose();
                }
            }
        } catch (error) {
            setTransactionStatus('failed');
            setError(error instanceof Error ? error.message : 'Deposit failed');
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
                label: 'Available to deposit',
                value: !isNaN(availableBalance)
                    ? formatNum(
                          availableBalance,
                          isUSDToken ? 2 : 8,
                          true,
                          isUSDToken,
                      )
                    : '-',
                tooltip:
                    'The maximum amount you can deposit based on your balance',
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
                <img src={FogoLogo} alt='Fogo Chain Logo' width='64px' />
                <h4>Deposit {selectedToken.symbol} from Fogo</h4>
            </div>

            <TokenDropdown
                selectedToken={selectedToken.symbol}
                onTokenSelect={handleTokenSelect}
                disabled={isProcessing}
                className={styles.tokenDropdown}
            />

            <div className={styles.input_container}>
                <h6>Amount</h6>
                {showInvalidSizeWarning && (
                    <span>{`Min: ${formatNum(MIN_DEPOSIT_AMOUNT, 2, true, true)}`}</span>
                )}
                <NumFormattedInput
                    placeholder={`Enter amount (min $${MIN_DEPOSIT_AMOUNT})`}
                    value={rawInputString}
                    onChange={handleDepositChange}
                    aria-label='deposit input'
                    autoFocus
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
                <button onClick={handleMaxClick} disabled={isProcessing}>
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
                onClick={handleDeposit}
                disabled={isButtonDisabled || isSizeInvalid}
                className={`plausible-event-name=Deposit+Button+Click plausible-event-maxActive=${maxActive}`}
            >
                {transactionStatus === 'pending'
                    ? 'Confirming Transaction...'
                    : isProcessing
                      ? 'Processing...'
                      : 'Deposit'}
            </SimpleButton>
        </div>
    );
}

// Export memoized component
export default memo(PortfolioDeposit);
