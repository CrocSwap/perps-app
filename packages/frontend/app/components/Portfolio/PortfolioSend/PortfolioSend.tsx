import { useState, useCallback, memo, useMemo } from 'react';
import Tooltip from '~/components/Tooltip/Tooltip';
import styles from './PortfolioSend.module.css';
import { useDebouncedCallback } from '~/hooks/useDebounce';
import TokenDropdown, {
    AVAILABLE_TOKENS,
    type Token,
} from '~/components/TokenDropdown/TokenDropdown';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { LuCircleHelp } from 'react-icons/lu';
import { t } from 'i18next';

interface PortfolioSendProps {
    availableAmount: number;
    tokenType: string;
    networkFee: string;
    onSend: (address: string, amount: number) => void;
    onClose: () => void;
    isProcessing?: boolean;
    portfolio: {
        id: string;
        name: string;
        availableBalance: number;
        unit?: string;
    };
}

function PortfolioSend({
    availableAmount,
    networkFee = '$0.001',
    onSend,

    isProcessing = false,
    portfolio,
}: PortfolioSendProps) {
    const [amount, setAmount] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token>(
        AVAILABLE_TOKENS.find(
            (token) => token.symbol === (portfolio.unit || 'USDe'),
        ) || AVAILABLE_TOKENS[0],
    );

    const CURRENCY_FORMATTER = useMemo(
        () =>
            new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        [],
    );

    const formatCurrency = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (value: number, currency = selectedToken) => {
            return CURRENCY_FORMATTER.format(value);
        },
        [CURRENCY_FORMATTER, selectedToken],
    );

    const validateAmount = useCallback(
        (inputAmount: number, maxAmount: number) => {
            if (isNaN(inputAmount) || inputAmount <= 0) {
                return {
                    isValid: false,
                    message: t('portfolio.amountGreaterThanZero'),
                };
            }

            if (inputAmount > maxAmount) {
                return {
                    isValid: false,
                    message: t('portfolio.exceedsAvailableBalance', {
                        balance: formatCurrency(maxAmount),
                    }),
                };
            }

            return { isValid: true, message: null };
        },
        [formatCurrency],
    );

    const debouncedAmountChange = useDebouncedCallback((newValue: string) => {
        setAmount(newValue);
        setError(null);
    }, 20);

    const debouncedAddressChange = useDebouncedCallback((newValue: string) => {
        setAddress(newValue);
        if (error && error.includes('address')) {
            setError(null);
        }
    }, 20);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            debouncedAmountChange(newValue);
        },
        [debouncedAmountChange],
    );

    const handleAddressChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            debouncedAddressChange(newValue);
        },
        [debouncedAddressChange],
    );

    const handleMaxClick = useCallback(() => {
        setAmount(availableAmount.toString());
        setError(null);
    }, [availableAmount]);

    const handleSend = useCallback(() => {
        const sendAmount = parseFloat(amount);

        const validation = validateAmount(sendAmount, availableAmount);

        if (!validation.isValid) {
            setError(validation.message);
            return;
        }

        if (!address.trim()) {
            setError(t('portfolio.invalidAddress'));
            return;
        }

        onSend(address, sendAmount);
    }, [amount, address, availableAmount, onSend, validateAmount]);

    const handleTokenSelect = useCallback((token: Token) => {
        setSelectedToken(token);
    }, []);

    // Memoize info items to prevent recreating on each render
    const infoItems = useMemo(
        () => [
            {
                label: t('portfolio.availableToSend'),
                value: formatCurrency(availableAmount),
                tooltip: t('portfolio.availableToSendTooltip'),
            },
            {
                label: t('portfolio.networkFee'),
                value: networkFee,
                tooltip: t('portfolio.networkFeeTooltip'),
            },
        ],
        [availableAmount, networkFee, formatCurrency],
    );

    // Memoize button disabled state
    const isButtonDisabled = useMemo(
        () =>
            isProcessing ||
            !amount ||
            !address ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableAmount,
        [isProcessing, amount, address, availableAmount],
    );

    return (
        <div className={styles.container}>
            <div className={styles.textContent}>
                <h4>
                    {t('portfolio.sendTitle', { token: selectedToken.symbol })}
                </h4>
                <p>{t('portfolio.sendDescription')}</p>
            </div>

            <div className={styles.inputContainer}>
                <input
                    type='text'
                    value={address}
                    onChange={handleAddressChange}
                    aria-label={t('aria.addressInput')}
                    placeholder={t('portfolio.enterAddress')}
                    disabled={isProcessing}
                />
            </div>

            {/* <div className={styles.inputContainer}>
                <div className={styles.tokenSelector}>
                    <div>{selectedToken.symbol}</div>
                    <LuChevronDown size={22} />
                </div>
            </div> */}
            <TokenDropdown
                selectedToken={selectedToken.symbol}
                onTokenSelect={handleTokenSelect}
                disabled={isProcessing}
                className={styles.tokenDropdown}
            />

            <div
                className={styles.inputContainer}
                style={{ position: 'relative' }}
            >
                <h6>{t('common.amount')}</h6>
                <input
                    type='text'
                    value={amount}
                    onChange={handleInputChange}
                    aria-label={t('aria.amountInput')}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder={t('portfolio.enterAmount')}
                    min='0'
                    step='any'
                    disabled={isProcessing}
                />
                <button onClick={handleMaxClick} disabled={isProcessing}>
                    {t('common.max')}
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
                onClick={handleSend}
                disabled={isButtonDisabled}
            >
                {isProcessing ? t('common.processing') : t('common.send')}
            </SimpleButton>
        </div>
    );
}

// Export memoized component
export default memo(PortfolioSend);
