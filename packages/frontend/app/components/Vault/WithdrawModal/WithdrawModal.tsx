import { useCallback, useState } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useVaultManager } from '~/routes/vaults/useVaultManager';
import FogoLogo from '../../../assets/tokens/FOGO.svg';
import styles from './WithdrawModal.module.css';
import { useTranslation } from 'react-i18next';

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
    // onClose,
}: WithdrawModalProps) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { formatCurrency, validateAmount } = useVaultManager();

    // Use a default unit if none is provided
    const unitValue = vault.unit || 'USD';

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;

            setAmount(newValue);
            setError(null);
        },
        [],
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
    ];

    const isButtonDisabled =
        !amount ||
        parseFloat(amount) <= 0 ||
        parseFloat(amount) > vault.yourDeposit;

    return (
        <div className={styles.container}>
            <div className={styles.text_content}>
                <img src={FogoLogo} alt='Fogo Chain Logo' width='64px' />
                <h4>
                    Withdraw {unitValue} from {vault.name}
                </h4>
                <div>
                    <p>{unitValue} will be sent to your address.</p>
                    <p>
                        A {unitValue === 'USD' ? '$1' : '0.0001 BTC'} fee will
                        be deducted from the {unitValue} withdrawn.
                    </p>
                    <p>Withdraws should arrive within 5 minutes.</p>
                </div>
            </div>

            <div className={styles.inputContainer}>
                <h6>Amount</h6>
                <input
                    type='text'
                    value={amount}
                    onChange={handleInputChange}
                    aria-label={t('aria.withdrawInput')}
                    data-modal-initial-focus
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Enter amount'
                    min='0'
                    step='any'
                />
                <button
                    onClick={handleMaxClick}
                    aria-label={t('aria.setMaxAmount')}
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
                                    <LuCircleHelp size={12} />
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
                aria-label={t('common.withdraw')}
            >
                {t('common.withdraw')}
            </button>
        </div>
    );
}
