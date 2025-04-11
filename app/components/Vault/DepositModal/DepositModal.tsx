import { useState, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import styles from './DepositModal.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { LuChevronDown } from 'react-icons/lu';
import { useVaultManager } from '~/routes/vaults/useVaultManager';

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
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState('USDe');

    const {
        formatCurrency,
        validateAmount,
        isValidNumberInput,
        getAvailableCapacity,
    } = useVaultManager();

    // Use the unit from the vault or default to USD
    const unitValue = vault.unit || 'USD';

    // Get available capacity for this vault
    const availableCapacity = getAvailableCapacity(vault.id);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;

            // Use the utility function for validation
            if (isValidNumberInput(newValue)) {
                setAmount(newValue);
                setError(null);
            }
        },
        [isValidNumberInput],
    );

    const handleMaxClick = useCallback(() => {
        setAmount(availableCapacity.toString());
        setError(null);
    }, [availableCapacity]);

    const handleDeposit = useCallback(() => {
        const depositAmount = parseFloat(amount);

        const validation = validateAmount(depositAmount, availableCapacity);

        if (!validation.isValid) {
            setError(validation.message);
            return;
        }

        onDeposit(depositAmount);
    }, [amount, availableCapacity, validateAmount, onDeposit]);

    const infoItems = [
        {
            label: 'Available to deposit',
            value: formatCurrency(availableCapacity, unitValue),
            tooltip:
                'The maximum amount you can deposit into this vault based on remaining capacity',
        },
        {
            label: 'Network Fee',
            value: unitValue === 'USD' ? '$0.001' : '0.00001 BTC',
            tooltip: 'Fee charged for processing the deposit transaction',
        },
    ];

    const isButtonDisabled =
        !amount ||
        parseFloat(amount) <= 0 ||
        parseFloat(amount) > availableCapacity;

    return (
        <div className={styles.container}>
            <header>
                <span />
                <h3>Deposit</h3>
                <MdClose onClick={onClose} />
            </header>
            <div className={styles.textContent}>
                <h4>
                    Deposit {unitValue} to {vault.name}
                </h4>
                <p>
                    Deposit {unitValue} to earn yield from the {vault.name}.
                    Deposits will be available for withdrawal after the next
                    epoch.
                </p>
            </div>

            <div className={styles.dropdownContainer}>
                <span>{selectedToken}</span>
                <LuChevronDown size={22} />
            </div>

            <div className={styles.inputContainer}>
                <h6>Amount</h6>
                <input
                    type='text'
                    value={amount}
                    onChange={handleInputChange}
                    aria-label='deposit input'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Enter amount'
                    min='0'
                    step='any'
                />
                <button onClick={handleMaxClick}>Max</button>
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
                onClick={handleDeposit}
                disabled={isButtonDisabled}
            >
                Deposit
            </button>
        </div>
    );
}
