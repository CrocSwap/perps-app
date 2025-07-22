import { useState, useCallback, memo, useMemo } from 'react';
import styles from './PortfolioDeposit.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { useDebouncedCallback } from '~/hooks/useDebounce';
import TokenDropdown, {
    AVAILABLE_TOKENS,
    type Token,
} from '~/components/TokenDropdown/TokenDropdown';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import FogoLogo from '../../../assets/tokens/FOGO.svg';

interface propsIF {
    portfolio: {
        id: string;
        name: string;
        availableBalance: number;
        unit?: string;
    };
    onDeposit: (amount: number) => void;
    onClose: () => void;
    isProcessing?: boolean;
}

function PortfolioDeposit(props: propsIF) {
    const { portfolio, onDeposit, isProcessing = false } = props;

    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token>(
        AVAILABLE_TOKENS.find(
            (token) => token.symbol === (portfolio.unit || 'USDe'),
        ) || AVAILABLE_TOKENS[0],
    );

    // Available balance for this portfolio
    const availableBalance = portfolio.availableBalance;

    const debouncedHandleChange = useDebouncedCallback((newValue: string) => {
        setAmount(newValue);
        setError(null);
    }, 20);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            debouncedHandleChange(newValue);
        },
        [debouncedHandleChange],
    );

    const handleMaxClick = useCallback(() => {
        setAmount(availableBalance.toString());
        setError(null);
    }, [availableBalance]);

    const handleDeposit = useCallback(() => {
        const depositAmount = parseFloat(amount);

        if (!depositAmount || isNaN(depositAmount)) {
            setError('Please enter a valid amount');
            return;
        }

        if (depositAmount <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        // Check minimum deposit of $10
        if (depositAmount < 10) {
            setError('Minimum deposit amount is $10.00');
            return;
        }

        if (depositAmount > availableBalance) {
            setError(`Amount exceeds available balance of ${availableBalance}`);
            return;
        }

        onDeposit(depositAmount);
    }, [amount, availableBalance, onDeposit]);

    const handleTokenSelect = useCallback((token: Token) => {
        setSelectedToken(token);
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

    // Memoize info items to prevent recreating on each render
    const infoItems = useMemo(
        () => [
            {
                label: 'Available to deposit',
                value: formatCurrency(availableBalance, selectedToken.symbol),
                tooltip:
                    'The maximum amount you can deposit based on your balance',
            },
            {
                label: 'Network Fee',
                value:
                    selectedToken.symbol === 'BTC' ? '0.00001 BTC' : '$0.001',
                tooltip: 'Fee charged for processing the deposit transaction',
            },
        ],
        [availableBalance, selectedToken.symbol, formatCurrency],
    );

    console.log(
        'for deposit: ' +
            formatCurrency(availableBalance, selectedToken.symbol),
    );

    // Check if amount is below minimum
    const isBelowMinimum = useMemo(() => {
        if (!amount) return false;
        const depositAmount = parseFloat(amount);
        return !isNaN(depositAmount) && depositAmount > 0 && depositAmount < 10;
    }, [amount]);

    const isButtonDisabled = useMemo(
        () =>
            isProcessing ||
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance,
        [isProcessing, amount, availableBalance],
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

            <div className={styles.inputContainer}>
                <h6>
                    Amount{' '}
                    {isBelowMinimum && (
                        <span className={styles.minWarning}>(Min: $10)</span>
                    )}
                </h6>
                <input
                    type='text'
                    value={amount}
                    onChange={handleInputChange}
                    aria-label='deposit input'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Enter amount (min $10)'
                    min='0'
                    step='any'
                    disabled={isProcessing}
                />
                <button
                    onClick={handleMaxClick}
                    disabled={isProcessing}
                    className={styles.maxButton}
                >
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

            <SimpleButton
                bg='accent1'
                onClick={handleDeposit}
                disabled={isButtonDisabled || isBelowMinimum}
            >
                {isProcessing ? 'Processing...' : 'Deposit'}
            </SimpleButton>
        </div>
    );
}

// Export memoized component
export default memo(PortfolioDeposit);
