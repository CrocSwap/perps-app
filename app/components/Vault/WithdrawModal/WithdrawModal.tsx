import { useState, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import styles from './WithdrawModal.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { useVaultManager } from '~/routes/vaults/useVaultManager';

interface WithdrawModalProps {
    vault: {
        id: string;
        name: string;
        yourDeposit: number;
        unit?: string;
    };
    onWithdraw: (amount: number) => void;
    onClose: () => void;
}

export default function WithdrawModal({
    vault,
    onWithdraw,
    onClose,
}: WithdrawModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { formatCurrency, validateAmount, isValidNumberInput } =
        useVaultManager();

    // Use a default unit if none is provided
    const unitValue = vault.unit || 'USD';

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;

            if (isValidNumberInput(newValue)) {
                setAmount(newValue);
                setError(null);
            }
        },
        [isValidNumberInput],
    );

    const handleMaxClick = useCallback(() => {
        setAmount(vault.yourDeposit.toString());
        setError(null);
    }, [vault.yourDeposit]);

    const handleWithdraw = useCallback(() => {
        const withdrawAmount = parseFloat(amount);

        const validation = validateAmount(withdrawAmount, vault.yourDeposit);

        if (!validation.isValid) {
            setError(validation.message);
            return;
        }

        onWithdraw(withdrawAmount);
    }, [amount, vault.yourDeposit, validateAmount, onWithdraw]);

    const infoItems = [
        {
            label: 'Available to withdraw',
            value: formatCurrency(vault.yourDeposit, unitValue),
            tooltip:
                'The total amount you have available to withdraw from this vault',
        },
        {
            label: 'Network Fee',
            value: unitValue === 'USD' ? '$1.00' : '0.0001 BTC',
            tooltip: 'Fee charged for processing the withdrawal transaction',
        },
    ];

    const isButtonDisabled =
        !amount ||
        parseFloat(amount) <= 0 ||
        parseFloat(amount) > vault.yourDeposit;

    return (
        <div className={styles.container}>
            <header>
                <span />
                <h3>Withdraw</h3>
                <MdClose onClick={onClose} />
            </header>
            <div className={styles.textContent}>
                <h4>
                    Withdraw {unitValue} from {vault.name}
                </h4>
                <p>
                    {unitValue} will be sent to your address. A{' '}
                    {unitValue === 'USD' ? '$1' : '0.0001 BTC'} fee will be
                    deducted from the {unitValue} withdrawn. Withdraws should
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
                onClick={handleWithdraw}
                disabled={isButtonDisabled}
            >
                Withdraw
            </button>
        </div>
    );
}
