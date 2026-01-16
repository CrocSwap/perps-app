import { Link } from 'react-router';
import VaultCard from '~/components/Vault/VaultCard/VaultCard';
import styles from './vaultsNew.module.css';

import Modal from '~/components/Modal/Modal';
import DepositModal from '~/components/Vault/DepositModal/DepositModal';
import WithdrawModal from '~/components/Vault/WithdrawModal/WithdrawModal';
import { useVaultManager } from './useVaultManager';

export function meta() {
    return [
        { title: 'Vaults | Ambient Finance' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

export default function vaultsNew() {
    const {
        vaults,
        selectedVault,
        modalOpen,
        modalContent,
        depositToVault,
        withdrawFromVault,
        processDeposit,
        processWithdraw,
        closeModal,
    } = useVaultManager();

    return (
        <>
            <div className={styles.container}>
                <header>
                    Vaults
                    <Link to='/'>Learn more</Link>
                </header>

                <div className={styles.content}>
                    {vaults.map((vault) => (
                        <VaultCard
                            key={vault.id}
                            name={vault.name}
                            icon={vault.icon}
                            description={vault.description}
                            apr={vault.apr}
                            totalDeposited={vault.totalDeposited}
                            totalCapacity={vault.totalCapacity}
                            yourDeposit={vault.yourDeposit}
                            hasWithdraw={vault.hasWithdraw}
                            unit={vault.unit}
                            onDeposit={() => depositToVault(vault.id)}
                            onWithdraw={
                                vault.hasWithdraw
                                    ? () => withdrawFromVault(vault.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            </div>

            {modalOpen && selectedVault && (
                <Modal
                    close={closeModal}
                    position='center'
                    title={modalContent === 'deposit' ? 'Deposit' : 'Withdraw'}
                >
                    {modalContent === 'deposit' && (
                        <DepositModal
                            vault={selectedVault}
                            onDeposit={processDeposit}
                            onClose={closeModal}
                        />
                    )}

                    {modalContent === 'withdraw' && (
                        <WithdrawModal
                            vault={selectedVault}
                            onWithdraw={processWithdraw}
                            onClose={closeModal}
                        />
                    )}
                </Modal>
            )}
        </>
    );
}
