import { useState, useCallback, memo, useMemo } from 'react';
import styles from './PortfolioWithdraw.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { useDebouncedCallback } from '~/hooks/useDebounce';

interface PortfolioWithdrawProps {
    portfolio: {
        id: string;
        name: string;
        availableBalance: number;
        unit?: string;
    };
    onWithdraw: (amount: number) => void;
    onClose: () => void;
    isProcessing?: boolean;
}

function PortfolioWithdraw({
    portfolio,
    onWithdraw,
    isProcessing = false,
}: PortfolioWithdrawProps) {
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const unitValue = portfolio.unit || 'USD';

    const isValidNumberInput = useCallback((value: string) => {
        if (value === '') return true;

        const regex = /^(\d+)?(\.\d{0,8})?$/;
        return regex.test(value);
    }, []);

    const USD_FORMATTER = useMemo(
        () =>
            new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        [],
    );

    const OTHER_FORMATTER = useMemo(
        () =>
            new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8,
            }),
        [],
    );

    const formatCurrency = useCallback(
        (value: number, unit: string) => {
            if (unit === 'USD') {
                return USD_FORMATTER.format(value);
            }
            return `${OTHER_FORMATTER.format(value)} ${unit}`;
        },
        [USD_FORMATTER, OTHER_FORMATTER],
    );

    const validateAmount = useCallback((amount: number, maxAmount: number) => {
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

        if (amount > maxAmount) {
            return {
                isValid: false,
                message: `Amount exceeds available balance of ${maxAmount}`,
            };
        }

        return {
            isValid: true,
            message: null,
        };
    }, []);

    const debouncedHandleChange = useDebouncedCallback((newValue: string) => {
        if (isValidNumberInput(newValue)) {
            setAmount(newValue);
            setError(null);
        }
    }, 150);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            debouncedHandleChange(newValue);
        },
        [debouncedHandleChange],
    );

    const handleMaxClick = useCallback(() => {
        setAmount(portfolio.availableBalance.toString());
        setError(null);
    }, [portfolio.availableBalance]);

    const handleWithdraw = useCallback(() => {
        const withdrawAmount = parseFloat(amount);

        const validation = validateAmount(
            withdrawAmount,
            portfolio.availableBalance,
        );

        if (!validation.isValid) {
            setError(validation.message);
            return;
        }

        onWithdraw(withdrawAmount);
    }, [amount, portfolio.availableBalance, onWithdraw, validateAmount]);

    // Memoize info items to prevent recreating on each render
    const infoItems = useMemo(
        () => [
            {
                label: 'Available to withdraw',
                value: formatCurrency(portfolio.availableBalance, unitValue),
                tooltip:
                    'The total amount you have available to withdraw from your portfolio',
            },
            {
                label: 'Network Fee',
                value: unitValue === 'USD' ? '$0.001' : '0.0001 BTC',
                tooltip:
                    'Fee charged for processing the withdrawal transaction',
            },
        ],
        [portfolio.availableBalance, unitValue, formatCurrency],
    );

    // Memoize button disabled state calculation
    const isButtonDisabled = useMemo(
        () =>
            isProcessing ||
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > portfolio.availableBalance,
        [isProcessing, amount, portfolio.availableBalance],
    );

    return (
        <div className={styles.container}>
     
            <div className={styles.textContent}>
                <h4>
                    Withdraw {unitValue} from {portfolio.name}
                </h4>
                <p>
                    {unitValue} will be sent to your address. A{' '}
                    {unitValue === 'USD' ? '$0.001' : '0.0001 BTC'} fee will be
                    deducted from the {unitValue} withdrawn. Withdrawals should
                    arrive within 5 minutes.
                </p>
            </div>

            <div className={styles.inputContainer}>
                <h6>Amount</h6>
                <input
                    type='text'
                    value={amount}
                    onChange={handleInputChange}
                    aria-label='withdraw input'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Enter amount'
                    min='0'
                    step='any'
                    disabled={isProcessing}
                />
                <button onClick={handleMaxClick} disabled={isProcessing}>
                    Max
                </button>
                {error && <div className={styles.error}>{error}</div>}
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
                                    <AiOutlineQuestionCircle size={13} />
                                </Tooltip>
                            )}
                        </div>
                        <div className={styles.infoValue}>{info.value}</div>
                    </div>
                ))}
            </div>
            <button
                className={styles.actionButton}
                onClick={handleWithdraw}
                disabled={isButtonDisabled}
            >
                {isProcessing ? 'Processing...' : 'Withdraw'}
            </button>
        </div>
    );
}

export default memo(PortfolioWithdraw);
