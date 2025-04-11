import React from 'react';
import styles from './VaultCard.module.css';
import { useVaultManager } from '~/routes/vaults/useVaultManager';

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
        icon,
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
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <div className={styles.perpsMarkLogo}>
                    <img
                        src={
                            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/2048px-Bitcoin.svg.png'
                        }
                        alt={`${name} logo`}
                    />
                </div>
                <div className={styles.headerTextContainer}>
                    <h3>{name}</h3>
                    <h6>{description}</h6>
                </div>
            </div>

            <div className={styles.detailsContainer}>
                <div className={styles.detailsItem}>
                    <h4>APR</h4>
                    <h5>{formatAPR(apr)}</h5>
                </div>

                <div className={styles.detailsItem}>
                    <h4>Total Deposited</h4>
                    <h5>{formatCurrency(totalDeposited, unit)}</h5>
                </div>

                <div className={styles.detailsItem}>
                    <h4>Total Capacity</h4>
                    <h5>{formatCurrency(totalCapacity, unit)}</h5>
                </div>
            </div>

            <div className={styles.depositContainer}>
                <h6>Your Deposit</h6>

                <input
                    type='text'
                    value={formatCurrency(yourDeposit, unit)}
                    aria-label='Your deposit amount'
                    readOnly
                />
            </div>

            <div className={styles.buttonContainer}>
                <button className={styles.depositButton} onClick={onDeposit}>
                    Deposit
                </button>
                {hasWithdraw && (
                    <button
                        className={styles.withdrawButton}
                        onClick={onWithdraw}
                    >
                        Withdraw
                    </button>
                )}
            </div>
        </div>
    );
});

export default VaultCard;
