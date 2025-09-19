import React from 'react';
import { Link } from 'react-router';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useVaultManager } from '~/routes/vaults/useVaultManager';
import styles from './VaultCard.module.css';
import { t } from 'i18next';

interface VaultCardProps {
    name: string;
    icon: string;
    description: string;
    apr: number;
    totalDeposited: number;
    totalCapacity: number;
    yourDeposit: number;
    hasWithdraw?: boolean;
    unit?: string;
    onDeposit?: () => void;
    onWithdraw?: () => void;
}

const VaultCard = React.memo(function VaultCard(props: VaultCardProps) {
    const {
        name,
        description,
        apr,
        totalDeposited,
        totalCapacity,
        yourDeposit,
        hasWithdraw = false,
        unit = 'USD',
        onDeposit,
        onWithdraw,
    } = props;

    const { formatCurrency, formatAPR } = useVaultManager();

    return (
        <div className={styles.vault_card}>
            <div className={styles.headerContainer}>
                <img
                    className={styles.market_logo}
                    src={
                        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/2048px-Bitcoin.svg.png'
                    }
                    alt={`${name} logo`}
                />
                <div className={styles.headerTextContainer}>
                    <h3>{name}</h3>
                    <h6>{description}</h6>
                </div>
                <Link
                    className={styles.more_info}
                    to={`/v2/vaults/0xdfc24b077bc1425ad1dea75bcb6f8158e10df303`}
                >
                    More Info
                </Link>
            </div>

            <div className={styles.details}>
                <div className={styles.detail_item}>
                    <h4>APR</h4>
                    <h5
                        style={{ color: `var(--${apr > 0 ? 'green' : 'red'})` }}
                    >
                        {formatAPR(apr)}
                    </h5>
                </div>

                <div className={styles.detail_item}>
                    <h4>Total Deposited</h4>
                    <h5>{formatCurrency(totalDeposited, unit)}</h5>
                </div>

                <div className={styles.detail_item}>
                    <h4>Total Capacity</h4>
                    <h5>{formatCurrency(totalCapacity, unit)}</h5>
                </div>
            </div>

            <div className={styles.depositContainer}>
                <h6>Your Deposit</h6>

                <input
                    type='text'
                    value={formatCurrency(yourDeposit, unit)}
                    aria-label={t('aria.yourDepositAmount')}
                    readOnly
                />
            </div>

            <div className={styles.buttonContainer}>
                <SimpleButton onClick={onDeposit} bg='accent1'>
                    Deposit
                </SimpleButton>
                {hasWithdraw && (
                    <SimpleButton
                        bg='dark3'
                        hoverBg='accent1'
                        onClick={onWithdraw}
                    >
                        Withdraw
                    </SimpleButton>
                )}
            </div>
        </div>
    );
});

export default VaultCard;
